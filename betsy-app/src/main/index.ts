import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { log } from './logger'
import { reduce, initialState, type WizardState, type WizardEvent } from './wizard-engine'
import { PersonaCache } from './persona-cache'
import { registerIpcHandlers } from './ipc'
import { HostedAuth } from './hosted-auth'

const isDev = !!process.env.VITE_DEV_SERVER_URL
const apiBase = process.env.BC_API_BASE ?? 'https://api.betsyai.io'

let mainWindow: BrowserWindow | null = null
let wizardState: WizardState = initialState()
let personaCache: PersonaCache | null = null
const hostedAuth = new HostedAuth(apiBase)
let activePollNonce: string | null = null

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    title: 'Betsy',
    webPreferences: {
      preload: join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL!)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    void win.loadFile(join(__dirname, '..', 'renderer', 'index.html'))
  }

  mainWindow = win
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
}

function pushWizardState(): void {
  mainWindow?.webContents.send('wizard:state-changed', wizardState)
}

function dispatchInternal(event: WizardEvent): void {
  wizardState = reduce(wizardState, event)
  pushWizardState()
}

async function runPollLoop(nonce: string): Promise<void> {
  activePollNonce = nonce
  // Up to ~6 minutes total — 12 rounds * 30s long-poll
  for (let i = 0; i < 12; i++) {
    if (activePollNonce !== nonce) return // newer login started
    try {
      const r = await hostedAuth.poll(nonce, 30_000)
      if (activePollNonce !== nonce) return
      if (r.kind === 'completed') {
        dispatchInternal({
          type: 'hosted-poll-success',
          jwt: r.jwt,
          workspaceId: r.workspaceId,
        })
        activePollNonce = null
        return
      }
      if (r.kind === 'expired') {
        dispatchInternal({ type: 'hosted-poll-timeout' })
        activePollNonce = null
        return
      }
      if (r.kind === 'error') {
        log('warn', 'hosted-poll-error', { status: r.status })
        break
      }
      // kind === 'timeout' — continue loop
    } catch (e) {
      log('warn', 'hosted-poll-throw', { err: String(e) })
      await new Promise((res) => setTimeout(res, 5_000))
    }
  }
  // exhausted retries
  if (activePollNonce === nonce) {
    dispatchInternal({ type: 'hosted-poll-timeout' })
    activePollNonce = null
  }
}

void app.whenReady().then(async () => {
  log('info', 'app-ready', { apiBase })

  personaCache = new PersonaCache(join(app.getPath('userData'), 'persona-cache'), apiBase)
  if (!personaCache.hasAny()) {
    try {
      await personaCache.refresh()
    } catch (e) {
      log('error', 'persona-cache-refresh-failed', { err: String(e) })
    }
  } else {
    void personaCache.refresh().catch((e) => {
      log('warn', 'persona-cache-bg-refresh-failed', { err: String(e) })
    })
  }

  registerIpcHandlers({
    'persona:list': async () => personaCache!.list(),
    'persona:avatarPath': async (id: string) => personaCache!.getAvatarPath(id),
    'wizard:getState': async () => wizardState,
    'wizard:dispatch': async (event: WizardEvent) => {
      wizardState = reduce(wizardState, event)
      pushWizardState()
      return wizardState
    },
    'hosted:startLogin': async (presetId: string) => {
      const r = await hostedAuth.start(presetId)
      dispatchInternal({
        type: 'hosted-nonce-received',
        nonce: r.nonce,
        deepLink: r.deepLink,
      })
      void runPollLoop(r.nonce)
      return { nonce: r.nonce, deepLink: r.deepLink }
    },
    'hosted:openExternal': async (url: string) => {
      await shell.openExternal(url)
    },
    'app:getInfo': async () => ({
      version: app.getVersion(),
      mode: wizardState.mode,
      engineUrl: wizardState.mode === 'hosted' ? apiBase : null,
    }),
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

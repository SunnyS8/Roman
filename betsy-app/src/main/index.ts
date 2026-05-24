import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { log } from './logger'
import { reduce, initialState, type WizardState, type WizardEvent } from './wizard-engine'
import { PersonaCache } from './persona-cache'
import { registerIpcHandlers } from './ipc'

const isDev = !!process.env.VITE_DEV_SERVER_URL
const apiBase = process.env.BC_API_BASE ?? 'https://api.betsyai.io'

let mainWindow: BrowserWindow | null = null
let wizardState: WizardState = initialState()
let personaCache: PersonaCache | null = null

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
    // Background refresh — non-blocking
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

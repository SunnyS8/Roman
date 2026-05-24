import { app } from 'electron'
import { mkdirSync, appendFileSync, statSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const LOG_DIR = join(app.getPath('userData'), 'logs')
const LOG_FILE = join(LOG_DIR, 'betsy-app.log')
const MAX_SIZE = 5 * 1024 * 1024

mkdirSync(LOG_DIR, { recursive: true })

function rotate(): void {
  try {
    const s = statSync(LOG_FILE)
    if (s.size > MAX_SIZE) renameSync(LOG_FILE, LOG_FILE + '.1')
  } catch {
    // file doesn't exist yet — no rotation needed
  }
}

export function log(level: 'info' | 'warn' | 'error', msg: string, meta?: object): void {
  rotate()
  const line = JSON.stringify({ t: new Date().toISOString(), level, msg, ...meta }) + '\n'
  try {
    appendFileSync(LOG_FILE, line)
  } catch {
    // best-effort logging
  }
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console[level](msg, meta ?? '')
  }
}

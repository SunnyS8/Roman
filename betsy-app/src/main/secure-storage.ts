import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export class SecureStorage {
  constructor(private filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true })
  }

  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  set(key: string, value: string): void {
    if (!this.isAvailable()) throw new Error('encryption unavailable on this OS')
    const all = this.loadAll()
    all[key] = safeStorage.encryptString(value).toString('base64')
    writeFileSync(this.filePath, JSON.stringify(all))
  }

  get(key: string): string | null {
    const all = this.loadAll()
    const enc = all[key]
    if (!enc) return null
    return safeStorage.decryptString(Buffer.from(enc, 'base64'))
  }

  remove(key: string): void {
    const all = this.loadAll()
    delete all[key]
    writeFileSync(this.filePath, JSON.stringify(all))
  }

  private loadAll(): Record<string, string> {
    if (!existsSync(this.filePath)) return {}
    try {
      return JSON.parse(readFileSync(this.filePath, 'utf-8')) as Record<string, string>
    } catch {
      return {}
    }
  }
}

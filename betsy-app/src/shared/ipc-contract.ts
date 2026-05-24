import type { WizardState, WizardEvent } from '../main/wizard-engine'
import type { CachedPreset } from '../main/persona-cache'

export interface SshCredsDto {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
}

export interface DeployParamsDto {
  presetId: string
  publicUrl: string
  port?: number
  botToken?: string
  engineVersion?: string
  saveCreds?: boolean
  host?: string
  user?: string
}

export interface AppInfo {
  version: string
  mode: 'hosted' | 'selfhost' | null
  engineUrl: string | null
}

export interface IpcContract {
  'persona:list': () => Promise<CachedPreset[]>
  'persona:avatarPath': (id: string) => Promise<string | null>
  'wizard:getState': () => Promise<WizardState>
  'wizard:dispatch': (event: WizardEvent) => Promise<WizardState>
  'hosted:startLogin': (presetId: string) => Promise<{ nonce: string; deepLink: string }>
  'hosted:openExternal': (url: string) => Promise<void>
  'ssh:connect': (creds: SshCredsDto) => Promise<{ ok: true } | { ok: false; error: string }>
  'ssh:deploy': (params: DeployParamsDto) => Promise<{ ok: boolean; error?: string }>
  'ssh:setBotWebhook': (
    token: string,
    publicUrl: string,
  ) => Promise<{ ok: boolean; error?: string }>
  'chat:send': (text: string) => Promise<void>
  'app:getInfo': () => Promise<AppInfo>
}

import { randomBytes } from 'node:crypto'

export interface EnvParams {
  presetId: string
  publicUrl: string
  port?: number
  botToken?: string
  engineVersion?: string
}

export interface GeneratedEnv {
  env: Record<string, string>
  asEnvFile: string
  dbPassword: string
  jwtSecret: string
}

export function generateEnv(params: EnvParams): GeneratedEnv {
  const dbPassword = randomBytes(24).toString('hex')
  const jwtSecret = randomBytes(48).toString('hex')
  const env: Record<string, string> = {
    BC_DB_PASSWORD: dbPassword,
    BC_JWT_SECRET: jwtSecret,
    BC_TG_BOT_TOKEN: params.botToken ?? '',
    BC_PUBLIC_URL: params.publicUrl,
    BC_PERSONA_PRESET_ID: params.presetId,
    BC_PORT: String(params.port ?? 3777),
    BC_ENGINE_VERSION: params.engineVersion ?? 'latest',
  }
  const asEnvFile =
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n'
  return { env, asEnvFile, dbPassword, jwtSecret }
}

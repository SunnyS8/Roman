import { describe, expect, it } from 'vitest'
import { generateEnv } from '../../src/main/docker-compose-template'

describe('generateEnv', () => {
  it('generates random db password and jwt secret', () => {
    const a = generateEnv({ presetId: 'betsy-default', publicUrl: 'http://1.2.3.4:3777' })
    const b = generateEnv({ presetId: 'betsy-default', publicUrl: 'http://1.2.3.4:3777' })
    expect(a.dbPassword).not.toBe(b.dbPassword)
    expect(a.jwtSecret).not.toBe(b.jwtSecret)
    expect(a.dbPassword.length).toBeGreaterThanOrEqual(40)
    expect(a.jwtSecret.length).toBeGreaterThanOrEqual(80)
  })

  it('includes all required env keys', () => {
    const { env } = generateEnv({ presetId: 'betsy-pro', publicUrl: 'http://x:3777' })
    expect(env.BC_PERSONA_PRESET_ID).toBe('betsy-pro')
    expect(env.BC_PUBLIC_URL).toBe('http://x:3777')
    expect(env.BC_PORT).toBe('3777')
    expect(env.BC_ENGINE_VERSION).toBe('latest')
    expect(env.BC_TG_BOT_TOKEN).toBe('') // empty until bot step
  })

  it('asEnvFile is valid .env format', () => {
    const { asEnvFile } = generateEnv({ presetId: 'betsy-default', publicUrl: 'http://x' })
    expect(asEnvFile).toMatch(/^BC_DB_PASSWORD=.+$/m)
    expect(asEnvFile.endsWith('\n')).toBe(true)
    expect(asEnvFile).not.toMatch(/^=$/m)
  })

  it('respects optional port + botToken + engineVersion', () => {
    const { env } = generateEnv({
      presetId: 'p',
      publicUrl: 'http://x',
      port: 4000,
      botToken: '123:abc',
      engineVersion: 'v1.2.3',
    })
    expect(env.BC_PORT).toBe('4000')
    expect(env.BC_TG_BOT_TOKEN).toBe('123:abc')
    expect(env.BC_ENGINE_VERSION).toBe('v1.2.3')
  })
})

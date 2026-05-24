import { describe, expect, it, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import type { EventEmitter } from 'node:events'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let resourcesDir: string

beforeAll(() => {
  resourcesDir = mkdtempSync(join(tmpdir(), 'ssh-bootstrap-'))
  writeFileSync(join(resourcesDir, 'docker-compose.template.yml'), 'version: 3.9\n')
})

afterAll(() => {
  rmSync(resourcesDir, { recursive: true, force: true })
})

vi.mock('ssh2', async () => {
  const { EventEmitter: EE } = await import('node:events')
  class FakeStream extends EE {
    stderr = new EE()
    end(): void {
      // no-op
    }
  }
  type Match = { cmd: string; stdout: string; stderr: string; code: number }
  class FakeClient extends EE {
    private _cmds: Match[] = []
    setMockExec(matches: Match[]): void {
      this._cmds = matches
    }
    connect(): void {
      setImmediate(() => this.emit('ready'))
    }
    end(): void {
      // no-op
    }
    exec(cmd: string, cb: (err: Error | null, stream: FakeStream) => void): void {
      const match = this._cmds.find((m) => cmd.includes(m.cmd))
      const stream = new FakeStream()
      cb(null, stream)
      setImmediate(() => {
        if (match) {
          if (match.stdout) stream.emit('data', Buffer.from(match.stdout))
          if (match.stderr) stream.stderr.emit('data', Buffer.from(match.stderr))
          stream.emit('close', match.code)
        } else {
          stream.emit('close', 0)
        }
      })
    }
    sftp(
      cb: (
        err: Error | null,
        sftp: { createWriteStream: () => EventEmitter & { end: () => void } },
      ) => void,
    ): void {
      cb(null, {
        createWriteStream: () => {
          const s = new EE() as EventEmitter & { end: () => void }
          s.end = (): void => {
            setImmediate(() => s.emit('close'))
          }
          return s
        },
      })
    }
  }
  return { Client: FakeClient }
})

import { SshBootstrap } from '../../src/main/ssh-bootstrap'

describe('SshBootstrap', () => {
  let bootstrap: SshBootstrap
  beforeEach(() => {
    bootstrap = new SshBootstrap(
      { host: 'h', port: 22, username: 'u', password: 'p' },
      resourcesDir,
    )
  })

  it('connect() resolves on ready', async () => {
    await expect(bootstrap.connect()).resolves.toBeUndefined()
  })

  it('runChecks() returns hasDocker=true when docker present', async () => {
    await bootstrap.connect()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(bootstrap as any).client.setMockExec([
      { cmd: 'uname -a', stdout: 'Linux ubuntu 6.0\n', stderr: '', code: 0 },
      { cmd: 'docker --version', stdout: 'Docker version 24.0\n', stderr: '', code: 0 },
      { cmd: 'docker compose version', stdout: 'compose v2\n', stderr: '', code: 0 },
      { cmd: 'df -BG', stdout: '  50G\n', stderr: '', code: 0 },
    ])
    const c = await bootstrap.runChecks()
    expect(c.hasDocker).toBe(true)
    expect(c.hasCompose).toBe(true)
    expect(c.diskFreeGb).toBeGreaterThanOrEqual(40)
    expect(c.warnings).not.toContain('low-disk')
  })

  it('runChecks() warns on low disk', async () => {
    await bootstrap.connect()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(bootstrap as any).client.setMockExec([
      { cmd: 'uname -a', stdout: 'Linux\n', stderr: '', code: 0 },
      { cmd: 'docker --version', stdout: 'Docker\n', stderr: '', code: 0 },
      { cmd: 'docker compose version', stdout: 'v2\n', stderr: '', code: 0 },
      { cmd: 'df -BG', stdout: '  3G\n', stderr: '', code: 0 },
    ])
    const c = await bootstrap.runChecks()
    expect(c.warnings).toContain('low-disk')
  })

  it('emits progress events during deploy', async () => {
    await bootstrap.connect()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(bootstrap as any).client.setMockExec([
      { cmd: 'uname -a', stdout: 'Linux\n', stderr: '', code: 0 },
      { cmd: 'docker --version', stdout: 'v24\n', stderr: '', code: 0 },
      { cmd: 'docker compose version', stdout: 'v2\n', stderr: '', code: 0 },
      { cmd: 'df -BG', stdout: '  50G\n', stderr: '', code: 0 },
      { cmd: 'curl -sf', stdout: 'ok', stderr: '', code: 0 },
    ])

    const events: { pct: number }[] = []
    bootstrap.on('progress', (e: { pct: number }) => events.push(e))
    await bootstrap.deploy({ presetId: 'betsy-default', publicUrl: 'http://1.2.3.4:3777' })
    const pcts = events.map((e) => e.pct)
    expect(pcts).toContain(15)
    expect(pcts).toContain(30)
    expect(pcts).toContain(100)
  })
})

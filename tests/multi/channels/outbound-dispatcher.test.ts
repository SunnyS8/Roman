import { describe, expect, it, vi } from 'vitest'
import { OutboundDispatcher } from '../../../src/multi/channels/outbound-dispatcher.js'

function fakeDesktop() {
  const calls: any[] = []
  return {
    name: 'desktop' as const,
    mirror: vi.fn(async (workspaceId: string, message: any) => {
      calls.push({ workspaceId, message })
    }),
    calls,
  }
}

describe('OutboundDispatcher', () => {
  it('forwards to all registered desktop adapters on primary != desktop', async () => {
    const d1 = fakeDesktop()
    const d2 = fakeDesktop()
    const dispatcher = new OutboundDispatcher()
    dispatcher.registerDesktop(d1 as any)
    dispatcher.registerDesktop(d2 as any)
    await dispatcher.afterPrimarySend({
      workspaceId: 'ws-A',
      primaryChannel: 'telegram',
      role: 'assistant',
      text: 'hi from TG',
    })
    expect(d1.mirror).toHaveBeenCalledOnce()
    expect(d2.mirror).toHaveBeenCalledOnce()
    expect(d1.calls[0].message.text).toBe('hi from TG')
    expect(d1.calls[0].message.channel).toBe('telegram')
    expect(d1.calls[0].workspaceId).toBe('ws-A')
  })

  it('does not mirror when primary == desktop (would echo)', async () => {
    const d = fakeDesktop()
    const dispatcher = new OutboundDispatcher()
    dispatcher.registerDesktop(d as any)
    await dispatcher.afterPrimarySend({
      workspaceId: 'ws-A',
      primaryChannel: 'desktop',
      role: 'assistant',
      text: 'already in desktop',
    })
    expect(d.mirror).not.toHaveBeenCalled()
  })

  it('mirrors user-side messages too', async () => {
    const d = fakeDesktop()
    const dispatcher = new OutboundDispatcher()
    dispatcher.registerDesktop(d as any)
    await dispatcher.afterPrimarySend({
      workspaceId: 'ws-A',
      primaryChannel: 'telegram',
      role: 'user',
      text: 'user typed in TG',
    })
    expect(d.mirror).toHaveBeenCalledOnce()
    expect(d.calls[0].message.role).toBe('user')
  })

  it('no-op when no desktop adapters registered', async () => {
    const dispatcher = new OutboundDispatcher()
    await expect(
      dispatcher.afterPrimarySend({
        workspaceId: 'ws-A',
        primaryChannel: 'telegram',
        role: 'assistant',
        text: 'whatever',
      }),
    ).resolves.toBeUndefined()
  })
})

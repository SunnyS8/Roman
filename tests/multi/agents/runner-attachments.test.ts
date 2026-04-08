import { describe, it, expect, vi } from 'vitest'
import { runBetsy } from '../../../src/multi/agents/runner.js'
import type { InboundAttachment } from '../../../src/multi/channels/base.js'

function mockDeps(agentRunner: any) {
  const workspace = {
    id: 'ws1',
    ownerTgId: 123,
    ownerMaxId: null,
    displayName: 'K',
    businessContext: null,
    addressForm: 'ty',
    personaId: 'betsy',
    plan: 'personal',
    status: 'active',
    tokensUsedPeriod: 0,
    tokensLimitPeriod: 1_000_000,
    periodResetAt: null,
    balanceKopecks: 0,
    lastActiveChannel: 'telegram',
    notifyChannelPref: 'auto',
    tz: 'Europe/Moscow',
    createdAt: new Date(),
  }
  const persona = {
    id: 'p1',
    workspaceId: 'ws1',
    presetId: 'betsy',
    name: 'Betsy',
    gender: 'female',
    voiceId: 'Aoede',
    personalityPrompt: null,
    biography: null,
    avatarS3Key: null,
    referenceFrontS3Key: null,
    referenceThreeQS3Key: null,
    referenceProfileS3Key: null,
    behaviorConfig: { voice: 'text_only', selfie: 'on_request', video: 'on_request' },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  return {
    wsRepo: { findById: vi.fn().mockResolvedValue(workspace) },
    personaRepo: { findByWorkspace: vi.fn().mockResolvedValue(persona) },
    factsRepo: {
      list: vi.fn().mockResolvedValue([]),
      listByKind: vi.fn().mockResolvedValue([]),
      listMissingEmbeddings: vi.fn().mockResolvedValue([]),
      searchByEmbedding: vi.fn().mockResolvedValue([]),
    },
    convRepo: {
      recent: vi.fn().mockResolvedValue([]),
      append: vi.fn().mockResolvedValue({ id: 'row-1' }),
      searchByEmbedding: vi.fn().mockResolvedValue([]),
    },
    remindersRepo: {},
    s3: {},
    gemini: {},
    agentRunner,
    ttsSpeak: vi.fn(),
  }
}

function attMock(id: string, base64: string, fetchSpy?: any): InboundAttachment {
  const fetch =
    fetchSpy ??
    vi.fn(async () => ({ base64, mimeType: 'image/jpeg' }))
  return {
    kind: 'image',
    fileId: id,
    mimeType: 'image/jpeg',
    fetch,
    summary: `photo ${id}`,
  }
}

describe('runBetsy — Fix5 attachments', () => {
  it('downloads attachments and forwards them as inlineParts', async () => {
    const agentRunner = vi.fn().mockResolvedValue({
      text: 'I see a photo',
      toolCalls: [],
      tokensUsed: 10,
    })
    const deps = mockDeps(agentRunner)
    const f1 = vi.fn(async () => ({ base64: 'AAA', mimeType: 'image/jpeg' }))
    const f2 = vi.fn(async () => ({ base64: 'BBB', mimeType: 'image/png' }))
    const a1 = { ...attMock('f1', 'AAA'), fetch: f1 }
    const a2 = { ...attMock('f2', 'BBB'), fetch: f2, mimeType: 'image/png' }
    a2.mimeType = 'image/png'

    await runBetsy({
      workspaceId: 'ws1',
      userMessage: 'check',
      channel: 'telegram',
      currentChatId: 'chat1',
      deps: deps as any,
      attachments: [a1, a2],
    })
    expect(f1).toHaveBeenCalled()
    expect(f2).toHaveBeenCalled()
    // agentRunner(agent, userMessage, history, inlineParts)
    const args = agentRunner.mock.calls[0]
    const inlineParts = args[3]
    expect(inlineParts).toHaveLength(2)
    expect(inlineParts[0].inlineData.data).toBe('AAA')
    expect(inlineParts[1].inlineData.data).toBe('BBB')
    expect(inlineParts[0].inlineData.mimeType).toBe('image/jpeg')
    expect(inlineParts[1].inlineData.mimeType).toBe('image/png')
    // userMessage suffix
    expect(args[1]).toContain('check')
    expect(args[1]).toContain('прислано 2 фото')
  })

  it('empty text + 1 attachment → placeholder userMessage', async () => {
    const agentRunner = vi.fn().mockResolvedValue({
      text: 'nice pic',
      toolCalls: [],
      tokensUsed: 1,
    })
    const deps = mockDeps(agentRunner)
    await runBetsy({
      workspaceId: 'ws1',
      userMessage: '',
      channel: 'telegram',
      currentChatId: 'chat1',
      deps: deps as any,
      attachments: [attMock('f', 'DATA')],
    })
    const userMessage = agentRunner.mock.calls[0][1]
    expect(userMessage).toContain('пользователь прислал фото без подписи')
  })

  it('replyToText is prepended to the userMessage', async () => {
    const agentRunner = vi.fn().mockResolvedValue({
      text: 'ok',
      toolCalls: [],
      tokensUsed: 1,
    })
    const deps = mockDeps(agentRunner)
    await runBetsy({
      workspaceId: 'ws1',
      userMessage: 'да',
      channel: 'telegram',
      currentChatId: 'chat1',
      deps: deps as any,
      replyToText: 'подтверди пожалуйста',
    })
    const userMessage = agentRunner.mock.calls[0][1]
    expect(userMessage.startsWith('[В ответ на: подтверди пожалуйста]')).toBe(true)
    expect(userMessage).toContain('да')
  })

  it('failed attachment fetch is skipped, other attachments still forwarded', async () => {
    const agentRunner = vi.fn().mockResolvedValue({
      text: 'ok',
      toolCalls: [],
      tokensUsed: 1,
    })
    const deps = mockDeps(agentRunner)
    const bad = {
      ...attMock('bad', ''),
      fetch: vi.fn(async () => {
        throw new Error('expired')
      }),
    }
    const good = attMock('good', 'GOOD')
    await runBetsy({
      workspaceId: 'ws1',
      userMessage: 'ok',
      channel: 'telegram',
      currentChatId: 'chat1',
      deps: deps as any,
      attachments: [bad, good],
    })
    const inlineParts = agentRunner.mock.calls[0][3]
    expect(inlineParts).toHaveLength(1)
    expect(inlineParts[0].inlineData.data).toBe('GOOD')
  })
})

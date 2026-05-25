import { describe, expect, it } from 'vitest'
import { postprocessAssistantText } from '../../../src/multi/agents/runner.js'

describe('postprocessAssistantText — name openers', () => {
  it('strips bare name greeting', () => {
    expect(postprocessAssistantText('Привет, Костя! Как дела?', 'Константин')).toBe(
      'Привет, Как дела?',
    )
  })

  it('strips "Договорились, Константин!"', () => {
    expect(postprocessAssistantText('Договорились, Константин!', 'Константин')).toBe(
      'Договорились,',
    )
  })

  it('keeps mid-sentence name', () => {
    expect(
      postprocessAssistantText('Я говорил Косте что это плохая идея', 'Константин'),
    ).toBe('Я говорил Косте что это плохая идея')
  })
})

describe('postprocessAssistantText — interjections', () => {
  it('strips leading "Ой, ..."', () => {
    expect(postprocessAssistantText('Ой, я ещё не придумала! 😊', 'Константин')).toBe(
      'Я ещё не придумала! 😊',
    )
  })

  it('strips leading "Ой!"', () => {
    expect(postprocessAssistantText('Ой! Забыла сказать.', 'Константин')).toBe(
      'Забыла сказать.',
    )
  })

  it('strips leading "Ну "', () => {
    expect(postprocessAssistantText('Ну хорошо, пойдём.', 'Константин')).toBe(
      'Хорошо, пойдём.',
    )
  })

  it('strips leading "Эх — ..."', () => {
    expect(postprocessAssistantText('Эх — устала уже.', 'Константин')).toBe('Устала уже.')
  })

  it('handles interjection + name combo', () => {
    expect(postprocessAssistantText('Ой, Костя, какие планы?', 'Константин')).toBe(
      'Какие планы?',
    )
  })

  it('does NOT strip mid-sentence "Ой"', () => {
    expect(postprocessAssistantText('А я подумала: ой, забыла', 'Константин')).toBe(
      'А я подумала: ой, забыла',
    )
  })
})

describe('postprocessAssistantText — edge cases', () => {
  it('returns text unchanged when no patterns match', () => {
    expect(postprocessAssistantText('Привет! Как дела?', 'Константин')).toBe(
      'Привет! Как дела?',
    )
  })

  it('returns text unchanged when ownerName is null', () => {
    expect(postprocessAssistantText('Привет, Костя!', null)).toBe('Привет, Костя!')
  })

  it('returns empty string unchanged', () => {
    expect(postprocessAssistantText('', 'Константин')).toBe('')
  })

  it('capitalizes first letter of cleaned text', () => {
    const out = postprocessAssistantText('Ой, привет!', 'Константин')
    expect(out[0]).toBe('П')
  })
})

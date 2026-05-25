/**
 * Unit tests for sanitizeNameOpenersFromHistory — the in-context cure for
 * Betsy behaviour-cloning past "Костя, ..." openers. These exercise the
 * private helper indirectly through the exported call shape that runner.ts
 * uses, but to keep the test focused we test by re-importing via a tiny
 * shim. If the helper isn't exported, we re-implement the same logic here
 * for verification — currently it lives in runner.ts as a module-private
 * function, which is intentional (only runner.ts is the caller).
 *
 * NB: since the helper is currently private, this test file imports the
 * regex builder + stripper logic by re-declaring it. The intent is to lock
 * the expected BEHAVIOUR; refactoring the regex must update these
 * fixtures.
 */
import { describe, expect, it } from 'vitest'

// Behavioural fixtures only — we assert what the runner's sanitizer must
// do, given past assistant turns and the owner name. If the runner changes
// its scrubbing strategy these expectations are what must still hold.
const cases: Array<{ name: string; input: string; expected: string; why: string }> = [
  {
    name: 'Константин',
    input: 'Привет, Костя! Как дела?',
    expected: 'Привет, Как дела?',
    why: 'bare greeting opener with short form',
  },
  {
    name: 'Константин',
    input: 'Конечно, Костя, я всегда тут!',
    expected: 'Конечно, я всегда тут!',
    why: 'opener-word then name in greeting position',
  },
  {
    name: 'Константин',
    input: 'Договорились, Константин!',
    expected: 'Договорились,',
    why: 'opener-word then full name with trailing punctuation',
  },
  {
    name: 'Константин',
    input: 'Ой, Костя, какие у меня могут быть планы?',
    expected: 'Ой, какие у меня могут быть планы?',
    why: '"Ой" + name in greeting (also separately flagged by anti-cliche)',
  },
  {
    name: 'Константин',
    input: 'Слушай, я говорил Косте что это плохая идея',
    expected: 'Слушай, я говорил Косте что это плохая идея',
    why: 'mid-sentence mention should NOT be stripped',
  },
  {
    name: 'Александр',
    input: 'Привет, Саша! Что нового?',
    expected: 'Привет, Что нового?',
    why: 'short form derivation works for other names',
  },
  {
    name: 'Дмитрий',
    input: 'Окей, Дима, делаем так.',
    expected: 'Окей, делаем так.',
    why: 'short form for Дмитрий',
  },
  {
    name: 'Константин',
    input: 'Поняла. Готово через 5 минут.',
    expected: 'Поняла. Готово через 5 минут.',
    why: 'no name at all → no change',
  },
]

import {
  sanitizeNameOpenersFromHistory as _exported,
} from '../../../src/multi/agents/runner.js'

describe('sanitizeNameOpenersFromHistory', () => {
  for (const c of cases) {
    it(`${c.why} — "${c.input}"`, () => {
      const out = _exported(
        [{ role: 'assistant', content: c.input }],
        c.name,
      )
      expect(out[0].content).toBe(c.expected)
    })
  }

  it('does not touch user turns', () => {
    const out = _exported(
      [
        { role: 'user', content: 'Привет, Костя!' },
        { role: 'assistant', content: 'Привет, Костя!' },
      ],
      'Константин',
    )
    expect(out[0].content).toBe('Привет, Костя!') // user untouched
    expect(out[1].content).toBe('Привет,')       // assistant cleaned
  })

  it('does not touch tool turns', () => {
    const out = _exported(
      [{ role: 'tool', content: '{"result":"привет, Костя"}' }],
      'Константин',
    )
    expect(out[0].content).toBe('{"result":"привет, Костя"}')
  })

  it('returns input unchanged when ownerName is null', () => {
    const input = [{ role: 'assistant' as const, content: 'Привет, Костя!' }]
    const out = _exported(input, null)
    expect(out).toBe(input)
  })

  it('returns input unchanged when ownerName is empty', () => {
    const input = [{ role: 'assistant' as const, content: 'Привет, Костя!' }]
    const out = _exported(input, '')
    expect(out).toBe(input)
  })
})

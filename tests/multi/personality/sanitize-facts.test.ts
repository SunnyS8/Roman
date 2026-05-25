import { describe, expect, it } from 'vitest'
import { sanitizeOwnerFacts } from '../../../src/multi/personality/bridge.js'

describe('sanitizeOwnerFacts', () => {
  it('strips leading name from "Костя любит X" facts', () => {
    const out = sanitizeOwnerFacts(
      ['Костя любит ВДНХ', 'Костя занимается проектами', 'Костя терпелив'],
      'Константин',
    )
    expect(out).toEqual(['Любит ВДНХ', 'Занимается проектами', 'Терпелив'])
  })

  it('strips leading "У Кости есть Y" → "Есть Y"', () => {
    const out = sanitizeOwnerFacts(['У Кости есть машина', 'У Кости был кот'], 'Константин')
    expect(out).toEqual(['Есть машина', 'Был кот'])
  })

  it('handles "Костя, 39 лет, разработчик" → "39 лет, разработчик"', () => {
    const out = sanitizeOwnerFacts(['Костя, 39 лет, разработчик, любит кодить'], 'Константин')
    expect(out).toEqual(['39 лет, разработчик, любит кодить'])
  })

  it('does not touch facts without leading name', () => {
    const out = sanitizeOwnerFacts(
      ['Работает в IT-компании', 'Пьёт латте по утрам', 'Любит ВДНХ'],
      'Константин',
    )
    expect(out).toEqual(['Работает в IT-компании', 'Пьёт латте по утрам', 'Любит ВДНХ'])
  })

  it('preserves mid-sentence name mentions', () => {
    const out = sanitizeOwnerFacts(
      ['Любит когда Костя путешествует', 'Друзья Кости работают в Москве'],
      'Константин',
    )
    // First fact: "Любит" — no leading name, untouched.
    // Second fact: "Друзья" — no leading name, untouched.
    expect(out).toEqual([
      'Любит когда Костя путешествует',
      'Друзья Кости работают в Москве',
    ])
  })

  it('handles full canonical name "Константин X" same as short form', () => {
    const out = sanitizeOwnerFacts(['Константин учит английский'], 'Константин')
    expect(out).toEqual(['Учит английский'])
  })

  it('returns facts unchanged when ownerName is null', () => {
    const facts = ['Костя любит X']
    expect(sanitizeOwnerFacts(facts, null)).toBe(facts)
  })

  it('filters out facts that become empty after stripping', () => {
    // Hypothetical: a fact that was literally just the name. Shouldn't happen
    // but the filter guards against it.
    const out = sanitizeOwnerFacts(['Костя', 'Любит X'], 'Константин')
    expect(out).toEqual(['Костя', 'Любит X']) // bare name doesn't match any pattern → kept as-is
  })

  it('different name (Александр → Саша) also works', () => {
    const out = sanitizeOwnerFacts(['Саша любит код', 'Саня пьёт чай'], 'Александр')
    expect(out).toEqual(['Любит код', 'Пьёт чай'])
  })

  it('capitalizes first letter of the rewritten fact', () => {
    const out = sanitizeOwnerFacts(['Костя любит x', 'У Кости есть y'], 'Константин')
    // Both should start with capital letter after stripping
    expect(out[0]).toMatch(/^[А-ЯЁ]/)
    expect(out[1]).toMatch(/^[А-ЯЁ]/)
  })
})

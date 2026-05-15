import { describe, expect, it } from 'vitest'
import { getDiffValueClass, getDiffValueTone, UNDEFINED_STYLE_VALUE } from '../../entrypoints/devtools-panel/utils/diff'

describe('diff utilities', () => {
  it('marks only the second value in a changed row as changed', () => {
    const row = { property: 'display', left: 'block', right: 'flex', isDiff: true }

    expect(getDiffValueTone(row, 'left')).toBe('muted')
    expect(getDiffValueTone(row, 'right')).toBe('changed')
    expect(getDiffValueClass(row, 'left')).toMatch(/\bbg-background\b/)
    expect(getDiffValueClass(row, 'right')).toMatch(/\bbg-red-50\b/)
  })

  it('marks a missing first value as a special tag', () => {
    const row = { property: 'gap', left: UNDEFINED_STYLE_VALUE, right: '8px', isDiff: true }

    expect(getDiffValueTone(row, 'left')).toBe('missing')
    expect(getDiffValueTone(row, 'right')).toBe('changed')
    expect(getDiffValueClass(row, 'left')).toMatch(/\bborder-dashed\b/)
  })

  it('marks a missing second value as a special tag', () => {
    const row = { property: 'gap', left: '8px', right: UNDEFINED_STYLE_VALUE, isDiff: true }

    expect(getDiffValueTone(row, 'left')).toBe('muted')
    expect(getDiffValueTone(row, 'right')).toBe('missing')
    expect(getDiffValueClass(row, 'left')).not.toMatch(/\bborder-dashed\b/)
    expect(getDiffValueClass(row, 'right')).toMatch(/\bborder-dashed\b/)
  })

  it('keeps equal rows visually muted', () => {
    const row = { property: 'display', left: 'block', right: 'block', isDiff: false }

    expect(getDiffValueTone(row, 'left')).toBe('muted')
    expect(getDiffValueTone(row, 'right')).toBe('muted')
  })
})

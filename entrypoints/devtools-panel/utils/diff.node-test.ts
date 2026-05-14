import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getDiffValueClass, getDiffValueTone, UNDEFINED_STYLE_VALUE } from './diff.ts'

describe('diff utilities', () => {
  it('marks both sides of a changed row as changed', () => {
    const row = { property: 'display', left: 'block', right: 'flex', isDiff: true }

    assert.equal(getDiffValueTone(row, 'left'), 'changed')
    assert.equal(getDiffValueTone(row, 'right'), 'changed')
    assert.match(getDiffValueClass(row, 'left'), /\bbg-foreground\b/)
    assert.match(getDiffValueClass(row, 'right'), /\bbg-foreground\b/)
  })

  it('marks an undefined side as missing', () => {
    const row = { property: 'gap', left: UNDEFINED_STYLE_VALUE, right: '8px', isDiff: true }

    assert.equal(getDiffValueTone(row, 'left'), 'missing')
    assert.equal(getDiffValueTone(row, 'right'), 'changed')
    assert.match(getDiffValueClass(row, 'left'), /\bborder-dashed\b/)
  })

  it('keeps equal rows visually muted', () => {
    const row = { property: 'display', left: 'block', right: 'block', isDiff: false }

    assert.equal(getDiffValueTone(row, 'left'), 'muted')
    assert.equal(getDiffValueTone(row, 'right'), 'muted')
  })
})

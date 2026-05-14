import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getDiffValueClass, getDiffValueTone, UNDEFINED_STYLE_VALUE } from './diff.ts'

describe('diff utilities', () => {
  it('marks only the second value in a changed row as changed', () => {
    const row = { property: 'display', left: 'block', right: 'flex', isDiff: true }

    assert.equal(getDiffValueTone(row, 'left'), 'muted')
    assert.equal(getDiffValueTone(row, 'right'), 'changed')
    assert.match(getDiffValueClass(row, 'left'), /\bbg-background\b/)
    assert.match(getDiffValueClass(row, 'right'), /\bbg-red-50\b/)
  })

  it('marks an undefined second value as missing', () => {
    const row = { property: 'gap', left: UNDEFINED_STYLE_VALUE, right: '8px', isDiff: true }

    assert.equal(getDiffValueTone(row, 'left'), 'muted')
    assert.equal(getDiffValueTone(row, 'right'), 'changed')
    assert.doesNotMatch(getDiffValueClass(row, 'left'), /\bborder-dashed\b/)
  })

  it('marks a missing second value as a special tag', () => {
    const row = { property: 'gap', left: '8px', right: UNDEFINED_STYLE_VALUE, isDiff: true }

    assert.equal(getDiffValueTone(row, 'right'), 'missing')
    assert.match(getDiffValueClass(row, 'right'), /\bborder-dashed\b/)
  })

  it('keeps equal rows visually muted', () => {
    const row = { property: 'display', left: 'block', right: 'block', isDiff: false }

    assert.equal(getDiffValueTone(row, 'left'), 'muted')
    assert.equal(getDiffValueTone(row, 'right'), 'muted')
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatLocaleMessage, getNextLocale, resolveLocale } from './locale.ts'

describe('locale utilities', () => {
  it('resolves stored and browser locale values', () => {
    assert.equal(resolveLocale('zh_CN'), 'zh_CN')
    assert.equal(resolveLocale('zh-CN'), 'zh_CN')
    assert.equal(resolveLocale('zh'), 'zh_CN')
    assert.equal(resolveLocale('en-US'), 'en')
    assert.equal(resolveLocale(null), 'en')
  })

  it('toggles between English and Simplified Chinese', () => {
    assert.equal(getNextLocale('en'), 'zh_CN')
    assert.equal(getNextLocale('zh_CN'), 'en')
  })

  it('formats Chrome i18n dollar escaping and substitutions', () => {
    assert.equal(formatLocaleMessage('Class uses `$$$$` and $1.', 'foo'), 'Class uses `$$` and foo.')
  })
})

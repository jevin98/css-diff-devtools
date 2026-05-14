import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatLocaleMessage, resolveLocale, SUPPORTED_LOCALES } from './locale.ts'

describe('locale utilities', () => {
  it('resolves stored and browser locale values', () => {
    assert.equal(resolveLocale('zh_CN'), 'zh_CN')
    assert.equal(resolveLocale('zh-CN'), 'zh_CN')
    assert.equal(resolveLocale('zh'), 'zh_CN')
    assert.equal(resolveLocale('en-US'), 'en')
    assert.equal(resolveLocale(null), 'en')
  })

  it('exposes language choices from a list', () => {
    assert.deepEqual(SUPPORTED_LOCALES.map(locale => locale.value), ['en', 'zh_CN'])
  })

  it('formats Chrome i18n dollar escaping and substitutions', () => {
    assert.equal(formatLocaleMessage('Class uses `$$$$` and $1.', 'foo'), 'Class uses `$$` and foo.')
  })
})

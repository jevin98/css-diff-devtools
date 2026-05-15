import { describe, expect, it } from 'vitest'
import { formatLocaleMessage, resolveLocale, SUPPORTED_LOCALES } from '../../entrypoints/devtools-panel/utils/locale'

describe('locale utilities', () => {
  it('resolves stored and browser locale values', () => {
    expect(resolveLocale('zh_CN')).toBe('zh_CN')
    expect(resolveLocale('zh-CN')).toBe('zh_CN')
    expect(resolveLocale('zh')).toBe('zh_CN')
    expect(resolveLocale('en-US')).toBe('en')
    expect(resolveLocale(null)).toBe('en')
  })

  it('exposes language choices from a list', () => {
    expect(SUPPORTED_LOCALES.map(locale => locale.value)).toEqual(['en', 'zh_CN'])
  })

  it('formats Chrome i18n dollar escaping and substitutions', () => {
    expect(formatLocaleMessage('Class uses `$$$$` and $1.', 'foo')).toBe('Class uses `$$` and foo.')
  })
})

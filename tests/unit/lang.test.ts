import { describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing'
import { activeLocale, initializeLocale } from '../../entrypoints/devtools-panel/lang'

describe('language initialization', () => {
  it('defaults to English when the user has not selected a language', () => {
    vi.spyOn(fakeBrowser.i18n, 'getUILanguage').mockReturnValue('zh-CN')

    initializeLocale(null)

    expect(activeLocale.value).toBe('en')
  })

  it('uses the saved language when the user has selected one', () => {
    initializeLocale('zh_CN')

    expect(activeLocale.value).toBe('zh_CN')
  })
})

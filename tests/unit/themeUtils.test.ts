import { describe, expect, it } from 'vitest'
import { getNextTheme, resolveAppliedTheme, resolveStoredTheme } from '../../entrypoints/devtools-panel/utils/theme'

describe('theme utilities', () => {
  it('defaults to system until a light or dark value is stored', () => {
    expect(resolveStoredTheme('dark')).toBe('dark')
    expect(resolveStoredTheme('light')).toBe('light')
    expect(resolveStoredTheme(null)).toBe('system')
    expect(resolveStoredTheme('unexpected')).toBe('system')
  })

  it('applies the system theme when preference is system', () => {
    expect(resolveAppliedTheme('system', 'dark')).toBe('dark')
    expect(resolveAppliedTheme('system', 'light')).toBe('light')
    expect(resolveAppliedTheme('dark', 'light')).toBe('dark')
    expect(resolveAppliedTheme('light', 'dark')).toBe('light')
  })

  it('toggles between light and dark', () => {
    expect(getNextTheme('light')).toBe('dark')
    expect(getNextTheme('dark')).toBe('light')
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getNextTheme, resolveAppliedTheme, resolveStoredTheme } from './theme.ts'

describe('theme utilities', () => {
  it('defaults to system until a light or dark value is stored', () => {
    assert.equal(resolveStoredTheme('dark'), 'dark')
    assert.equal(resolveStoredTheme('light'), 'light')
    assert.equal(resolveStoredTheme(null), 'system')
    assert.equal(resolveStoredTheme('unexpected'), 'system')
  })

  it('applies the system theme when preference is system', () => {
    assert.equal(resolveAppliedTheme('system', 'dark'), 'dark')
    assert.equal(resolveAppliedTheme('system', 'light'), 'light')
    assert.equal(resolveAppliedTheme('dark', 'light'), 'dark')
    assert.equal(resolveAppliedTheme('light', 'dark'), 'light')
  })

  it('toggles between light and dark', () => {
    assert.equal(getNextTheme('light'), 'dark')
    assert.equal(getNextTheme('dark'), 'light')
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getNextTheme, resolveStoredTheme } from './theme.ts'

describe('theme utilities', () => {
  it('uses dark only when the stored value is dark', () => {
    assert.equal(resolveStoredTheme('dark'), 'dark')
    assert.equal(resolveStoredTheme('light'), 'light')
    assert.equal(resolveStoredTheme(null), 'light')
    assert.equal(resolveStoredTheme('unexpected'), 'light')
  })

  it('toggles between light and dark', () => {
    assert.equal(getNextTheme('light'), 'dark')
    assert.equal(getNextTheme('dark'), 'light')
  })
})

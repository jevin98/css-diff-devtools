import { afterEach, beforeEach, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing'

beforeEach(() => {
  fakeBrowser.reset()
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

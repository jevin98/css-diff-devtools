import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { scrollToTop } from './scroll.ts'

describe('scroll utilities', () => {
  it('scrolls the provided container to the top', () => {
    let options: ScrollToOptions | undefined

    scrollToTop({
      scrollTo(value: ScrollToOptions) {
        options = value
      },
    })

    assert.deepEqual(options, { top: 0, behavior: 'smooth' })
  })

  it('does nothing when the container is missing', () => {
    assert.doesNotThrow(() => scrollToTop(null))
  })
})

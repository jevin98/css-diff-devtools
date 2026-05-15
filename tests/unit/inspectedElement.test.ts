import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { createResolveSelectedElementExpression, SELECTED_ELEMENT_STORE_KEY } from '../../entrypoints/devtools-panel/utils/inspectedElement'

describe('inspected element scripts', () => {
  it('resolves a cached selected element by inspect id', () => {
    const element = {}
    const context = {
      [SELECTED_ELEMENT_STORE_KEY]: {
        elements: {
          'target-inspect-id': element,
        },
      },
    }

    expect(runInNewContext(createResolveSelectedElementExpression('target-inspect-id'), context)).toBe(element)
  })

  it('returns null when the selected element is not cached in the current inspected page', () => {
    expect(runInNewContext(createResolveSelectedElementExpression('missing-inspect-id'), {})).toBeNull()
  })

  it('falls back to a DOM path when the selected element cache is unavailable', () => {
    const element = {}
    const document = {
      querySelector: vi.fn(() => element),
    }

    expect(runInNewContext((createResolveSelectedElementExpression as any)('missing-inspect-id', 'html > body > a:nth-of-type(1)'), { document })).toBe(element)
    expect(document.querySelector).toHaveBeenCalledWith('html > body > a:nth-of-type(1)')
  })
})

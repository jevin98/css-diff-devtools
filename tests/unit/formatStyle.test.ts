import { describe, expect, it, vi } from 'vitest'
import { formatStyle } from '../../entrypoints/devtools-panel/utils/formatStyle'

describe('formatStyle', () => {
  it('returns null for an empty selected element', () => {
    expect(formatStyle(null as unknown as Element)).toBeNull()
  })

  it('returns element identity and computed style values', () => {
    document.body.innerHTML = '<button id="save" class="primary"></button>'
    const button = document.querySelector('button')!

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      0: 'display',
      1: 'color',
      length: 2,
      getPropertyValue: vi.fn((property: string) => {
        if (property === 'display') {
          return 'block'
        }

        if (property === 'color') {
          return 'rgb(255, 0, 0)'
        }

        return 'unexpected'
      }),
    } as unknown as CSSStyleDeclaration)

    expect(formatStyle(button)).toEqual({
      tag: 'BUTTON',
      id: 'save',
      class: 'primary',
      style: {
        display: 'block',
        color: 'rgb(255, 0, 0)',
      },
    })
  })
})

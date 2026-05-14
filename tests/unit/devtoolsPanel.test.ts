import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing'

describe('devtools-panel', () => {
  it('renders the initial comparison panel shell', async () => {
    vi.resetModules()
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })

    const messages: Record<string, string> = {
      info: 'Select two elements in the Elements tab of the DevTools panel and the style differences will be shown below.',
      inputPlaceholder: 'Please enter the css property you want to view',
      isAllProperty: 'Show all',
      property: 'property',
      removeBtn: 'Clear Selection',
      selectedInfo: 'Please select two elements to compare.',
      tableColumnInfo: 'The header name is concatenated from the DOM\'s `TagName`, `Id`, and `Class` attributes using `$$$$`.',
    }

    vi.spyOn(fakeBrowser.i18n, 'getMessage').mockImplementation((key: string) => messages[key] ?? key)
    vi.spyOn(fakeBrowser.i18n, 'getUILanguage').mockReturnValue('en')

    ;(globalThis as any).browser.devtools = {
      panels: {
        elements: {
          onSelectionChanged: {
            addListener: vi.fn(),
          },
        },
      },
      inspectedWindow: {
        eval: vi.fn(),
      },
    }

    const { default: DevtoolsPanel } = await import('../../entrypoints/devtools-panel/devtools-panel.vue')

    const wrapper = mount(DevtoolsPanel, {
      global: {
        stubs: {
          Toaster: true,
        },
      },
    })

    expect(wrapper.text()).toContain('DOM Diff')
    expect(wrapper.text()).toContain('Select two elements in the Elements tab')
    expect(wrapper.text()).toContain('Please select two elements to compare.')
  })
})

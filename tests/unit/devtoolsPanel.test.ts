import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { fakeBrowser } from 'wxt/testing'
import messages from '../../entrypoints/devtools-panel/lang'

describe('devtools-panel', () => {
  it('renders the initial comparison panel shell', async () => {
    vi.resetModules()
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })

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
    const i18n = createI18n({
      locale: 'en',
      messages,
    })

    const wrapper = mount(DevtoolsPanel, {
      global: {
        plugins: [i18n],
        stubs: {
          ElBacktop: true,
          ElButton: { template: '<button><slot /></button>' },
          ElCheckbox: true,
          ElIcon: { template: '<span><slot /></span>' },
          ElInput: true,
          ElOption: true,
          ElSelect: { template: '<select><slot /></select>' },
          ElTable: { template: '<table><slot /></table>' },
          ElTableColumn: true,
          ElText: { template: '<p><slot /></p>' },
          ElTooltip: { template: '<span><slot /></span>' },
        },
      },
    })

    expect(wrapper.text()).toContain('DOM Diff')
    expect(wrapper.text()).toContain('Select two elements in the Elements tab')
    expect(wrapper.text()).toContain('Please select two elements to compare.')
  })
})

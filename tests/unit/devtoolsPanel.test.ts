import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { fakeBrowser } from 'wxt/testing'

describe('devtools-panel', () => {
  function setupExtensionApi() {
    const messages: Record<string, string> = {
      allProperties: 'All properties',
      changed: 'Changed',
      changedOnly: 'Changed only',
      className: 'Class',
      diffs: 'Diffs',
      elementDetails: 'Element details',
      emptyElement: 'No element selected',
      filter: 'Filter',
      fullName: 'Full',
      idName: 'ID',
      info: 'Select two elements in the Elements tab of the DevTools panel and the style differences will be shown below.',
      inputPlaceholder: 'Please enter the css property you want to view',
      isAllProperty: 'Show all',
      nativeHoverTooltip: 'Hover to highlight this DOM node in the inspected page. Requires Chrome debugger permission and may show a browser debugging notice.',
      property: 'property',
      readyToCompare: 'Ready to compare',
      removeBtn: 'Clear Selection',
      removeSelectedElement: 'Remove $1 selection',
      selectedInfo: 'Please select two elements to compare.',
      selection: 'Selection',
      sourceElement: 'Source',
      tableColumnInfo: 'The header name is concatenated from the DOM\'s `TagName`, `Id`, and `Class` attributes using `$$$$`.',
      tagName: 'Tag',
      targetElement: 'Target',
      total: 'Total',
      undefinedStyleValue: 'Undefined',
      waitingSelection: 'Waiting for selection',
    }
    const runtimeMessageListeners: Array<(data: unknown) => void> = []
    let selectionChangedListener: (() => void) | undefined
    const inspectedWindowEval = vi.fn((_expression: string, callback?: (result: unknown, isException?: boolean) => void) => {
      callback?.(true, false)
    })
    const debuggerCommands: Array<{ commandParams?: object, method: string }> = []
    const debuggerApi = {
      attach: vi.fn(async () => undefined),
      detach: vi.fn(async () => undefined),
      sendCommand: vi.fn(async (_debuggee: chrome.debugger.Debuggee, method: string, commandParams?: object) => {
        debuggerCommands.push({ commandParams, method })

        if (method === 'Runtime.evaluate') {
          return { result: { objectId: 'node-object-id' } }
        }

        if (method === 'DOM.describeNode') {
          return { node: { backendNodeId: 77 } }
        }

        return {}
      }),
    }

    vi.resetModules()
    vi.spyOn(fakeBrowser.i18n, 'getMessage').mockImplementation((key: string, substitutions?: string | string[]) => {
      const value = messages[key] ?? key
      const replacements = Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : []

      return replacements.reduce((message, replacement, index) => message.replace(`$${index + 1}`, replacement), value)
    })
    vi.spyOn(fakeBrowser.i18n, 'getUILanguage').mockReturnValue('en')
    vi.spyOn(fakeBrowser.runtime.onMessage, 'addListener').mockImplementation((callback: (data: unknown) => void) => {
      runtimeMessageListeners.push(callback)

      return undefined as never
    })

    ;(globalThis as any).browser.devtools = {
      panels: {
        elements: {
          onSelectionChanged: {
            addListener: vi.fn((callback: () => void) => {
              selectionChangedListener = callback
            }),
          },
        },
      },
      inspectedWindow: {
        tabId: 1,
        eval: inspectedWindowEval,
      },
    }
    ;(globalThis as any).chrome = {
      ...(globalThis as any).chrome,
      debugger: debuggerApi,
    }

    return {
      debuggerApi,
      debuggerCommands,
      dispatchRuntimeMessage(data: unknown) {
        runtimeMessageListeners.forEach(listener => listener(data))
      },
      inspectedWindowEval,
      triggerSelectionChanged() {
        selectionChangedListener?.()
      },
    }
  }

  async function flushDebuggerPromises() {
    await new Promise(resolve => window.setTimeout(resolve, 0))
    await new Promise(resolve => window.setTimeout(resolve, 0))
  }

  async function mountPanel() {
    const { default: DevtoolsPanel } = await import('../../entrypoints/devtools-panel/devtools-panel.vue')

    return mount(DevtoolsPanel, {
      global: {
        stubs: {
          Toaster: true,
        },
      },
    })
  }

  async function selectTwoElements(dispatchRuntimeMessage: (data: unknown) => void) {
    dispatchRuntimeMessage([
      {
        valueType: 'left',
        inspectId: 'left-local-inspect-id',
        inspectPath: 'html > body > div:nth-of-type(1)',
        inspectTabId: 1,
        tag: 'div',
        id: 'source',
        class: 'source-card',
        style: {
          color: 'rgb(34, 34, 34)',
          display: 'block',
        },
      },
      {
        valueType: 'right',
        inspectId: 'right-remote-inspect-id',
        inspectPath: 'html > body > img:nth-of-type(1)',
        inspectTabId: 1,
        tag: 'div',
        id: 'target',
        class: 'target-card',
        style: {
          color: 'rgb(0, 0, 0)',
          display: 'flex',
        },
      },
    ])
    await nextTick()
  }

  it('renders the initial comparison panel shell', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    setupExtensionApi()

    const wrapper = await mountPanel()

    expect(wrapper.text()).toContain('DOM Diff')
    expect(wrapper.text()).toContain('Waiting for selection')
    expect(wrapper.text()).toContain('Selection')
    expect(wrapper.text()).toContain('Source')
    expect(wrapper.text()).toContain('Target')
    expect(wrapper.text()).toContain('Please select two elements to compare.')
  })

  it('highlights the source column through the Chrome debugger overlay when hovered', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    const wrapper = await mountPanel()

    await selectTwoElements(extensionApi.dispatchRuntimeMessage)
    await wrapper.findAll('th')[1].trigger('pointerenter')
    await flushDebuggerPromises()

    expect(extensionApi.debuggerApi.attach).toHaveBeenCalledWith({ tabId: 1 }, '1.3')
    expect(extensionApi.debuggerCommands.map(call => call.method)).toContain('Overlay.highlightNode')
    expect(extensionApi.debuggerCommands.find(call => call.method === 'Runtime.evaluate')?.commandParams).toMatchObject({
      expression: expect.stringContaining('left-local-inspect-id'),
    })
  })

  it('prepares the Chrome debugger session after two local elements are selected', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    await mountPanel()

    await selectTwoElements(extensionApi.dispatchRuntimeMessage)
    await flushDebuggerPromises()

    expect(extensionApi.debuggerApi.attach).toHaveBeenCalledWith({ tabId: 1 }, '1.3')
    expect(extensionApi.debuggerCommands.map(call => call.method)).toEqual([
      'DOM.enable',
      'Overlay.enable',
    ])
  })

  it('hides the debugger overlay when the selected table header is no longer hovered', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    const wrapper = await mountPanel()
    const sourceHeader = wrapper.findAll('th')[1]

    await selectTwoElements(extensionApi.dispatchRuntimeMessage)
    await sourceHeader.trigger('pointerenter')
    await flushDebuggerPromises()
    await sourceHeader.trigger('pointerleave')
    await flushDebuggerPromises()

    expect(extensionApi.debuggerCommands.map(call => call.method)).toEqual([
      'DOM.enable',
      'Overlay.enable',
      'Runtime.evaluate',
      'DOM.describeNode',
      'Overlay.highlightNode',
      'Overlay.hideHighlight',
      'Runtime.releaseObjectGroup',
    ])
  })

  it('keeps the same inspected element active when the pointer moves within a selected column', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    const wrapper = await mountPanel()

    await selectTwoElements(extensionApi.dispatchRuntimeMessage)

    const sourceCells = wrapper.findAll('[data-css-diff-inspect-id="left-local-inspect-id"]')

    expect(sourceCells.length).toBeGreaterThanOrEqual(2)

    await sourceCells[1]!.trigger('pointerenter')
    await flushDebuggerPromises()
    await sourceCells[1]!.trigger('pointerleave', {
      relatedTarget: sourceCells[2]!.element,
    })
    await flushDebuggerPromises()

    expect(extensionApi.debuggerCommands.map(call => call.method)).not.toContain('Overlay.hideHighlight')
  })

  it('keeps the hover session active when the pointer moves between selected columns', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    const wrapper = await mountPanel()

    await selectTwoElements(extensionApi.dispatchRuntimeMessage)

    const sourceCells = wrapper.findAll('[data-css-diff-inspect-id="left-local-inspect-id"]')
    const targetCells = wrapper.findAll('[data-css-diff-inspect-id="right-remote-inspect-id"]')

    await targetCells[1]!.trigger('pointerenter')
    await flushDebuggerPromises()
    await targetCells[1]!.trigger('pointerleave', {
      relatedTarget: sourceCells[1]!.element,
    })
    await flushDebuggerPromises()
    await sourceCells[1]!.trigger('pointerenter')
    await flushDebuggerPromises()

    expect(extensionApi.debuggerCommands.map(call => call.method).filter(method => method === 'Overlay.highlightNode')).toHaveLength(2)
    expect(extensionApi.debuggerCommands.map(call => call.method)).not.toContain('Overlay.hideHighlight')
  })

  it('uses the selected element inspect id instead of a value type when hovering synced columns', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    const wrapper = await mountPanel()

    await selectTwoElements(extensionApi.dispatchRuntimeMessage)
    await wrapper.findAll('th')[2].trigger('pointerenter')
    await flushDebuggerPromises()

    const runtimeEvaluate = extensionApi.debuggerCommands.find(call => call.method === 'Runtime.evaluate')

    expect(runtimeEvaluate?.commandParams).toMatchObject({
      expression: expect.stringContaining('right-remote-inspect-id'),
    })
    expect(runtimeEvaluate?.commandParams).toMatchObject({
      expression: expect.stringContaining('querySelector'),
    })
    expect(JSON.stringify(runtimeEvaluate?.commandParams)).not.toContain('["right"]')
  })

  it('does not highlight DOM data selected from another inspected tab', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    const wrapper = await mountPanel()

    extensionApi.dispatchRuntimeMessage([
      {
        valueType: 'left',
        inspectId: 'left-remote-inspect-id',
        inspectPath: 'html > body > div:nth-of-type(1)',
        inspectTabId: 2,
        tag: 'div',
        id: 'source',
        class: 'source-card',
        style: {
          color: 'rgb(34, 34, 34)',
        },
      },
      {
        valueType: 'right',
        inspectId: 'right-remote-inspect-id',
        inspectPath: 'html > body > img:nth-of-type(1)',
        inspectTabId: 2,
        tag: 'img',
        id: '',
        class: '',
        style: {
          color: 'rgb(0, 0, 0)',
        },
      },
    ])
    await nextTick()
    await wrapper.findAll('th')[1].trigger('pointerenter')
    await flushDebuggerPromises()

    expect(extensionApi.debuggerApi.attach).not.toHaveBeenCalled()
    expect(extensionApi.debuggerCommands).toEqual([])
  })

  it('does not use inspectedWindow inspect scripts when hovering a diff column', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    const wrapper = await mountPanel()

    await selectTwoElements(extensionApi.dispatchRuntimeMessage)
    await wrapper.findAll('th')[1].trigger('pointerenter')
    await flushDebuggerPromises()

    expect(extensionApi.inspectedWindowEval).not.toHaveBeenCalled()
    expect(extensionApi.debuggerCommands.map(call => call.method)).toContain('Overlay.highlightNode')
  })

  it('shows a tooltip explaining the native hover permission requirement on DOM diff cells', async () => {
    await fakeBrowser.tabs.create({ active: true, url: 'https://example.com' })
    const extensionApi = setupExtensionApi()
    const wrapper = await mountPanel()

    await selectTwoElements(extensionApi.dispatchRuntimeMessage)

    expect(wrapper.find('[data-css-diff-inspect-id="left-local-inspect-id"]').attributes('title')).toBe('Hover to highlight this DOM node in the inspected page. Requires Chrome debugger permission and may show a browser debugging notice.')
  })
})

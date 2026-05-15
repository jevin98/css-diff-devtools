import { describe, expect, it, vi } from 'vitest'
import { type DebuggerApi, DevToolsOverlayHighlighter } from '../../entrypoints/devtools-panel/utils/devtoolsOverlay'

function createDebuggerApi(objectId = 'node-object-id') {
  const calls: Array<{ commandParams?: object, method: string }> = []
  const debuggerApi: DebuggerApi = {
    attach: vi.fn(async () => undefined),
    detach: vi.fn(async () => undefined),
    sendCommand: vi.fn(async (_debuggee, method, commandParams) => {
      calls.push({ commandParams, method })

      if (method === 'Runtime.evaluate') {
        return { result: objectId ? { objectId } : {} }
      }

      return {}
    }),
  }

  return {
    calls,
    debuggerApi,
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void

  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve
  })

  return { promise, resolve }
}

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('devToolsOverlayHighlighter', () => {
  it('highlights a cached inspected element through the Chrome debugger overlay', async () => {
    const { calls, debuggerApi } = createDebuggerApi()
    const highlighter = new DevToolsOverlayHighlighter(() => 10, debuggerApi)

    await expect(highlighter.highlight('source-inspect-id')).resolves.toBe(true)

    expect(debuggerApi.attach).toHaveBeenCalledWith({ tabId: 10 }, '1.3')
    expect(calls.map(call => call.method)).toEqual([
      'DOM.enable',
      'Overlay.enable',
      'Runtime.evaluate',
      'DOM.describeNode',
      'Overlay.highlightNode',
    ])
    expect(calls[2]?.commandParams).toMatchObject({
      expression: expect.stringContaining('source-inspect-id'),
      returnByValue: false,
    })
    expect(calls[3]?.commandParams).toMatchObject({
      objectId: 'node-object-id',
    })
    expect(calls[4]?.commandParams).toMatchObject({
      objectId: 'node-object-id',
    })
  })

  it('resolves a selected element by DOM path and highlights its backend node id', async () => {
    const calls: Array<{ commandParams?: object, method: string }> = []
    const debuggerApi: DebuggerApi = {
      attach: vi.fn(async () => undefined),
      detach: vi.fn(async () => undefined),
      sendCommand: vi.fn(async (_debuggee, method, commandParams) => {
        calls.push({ commandParams, method })

        if (method === 'Runtime.evaluate') {
          return { result: { objectId: 'node-object-id' } }
        }

        if (method === 'DOM.describeNode') {
          return { node: { backendNodeId: 42 } }
        }

        return {}
      }),
    }
    const highlighter = new DevToolsOverlayHighlighter(() => 10, debuggerApi)

    await expect(highlighter.highlight({
      inspectId: 'source-inspect-id',
      inspectPath: 'html > body > a:nth-of-type(1)',
      inspectTabId: 10,
    } as any)).resolves.toBe(true)

    expect(calls.map(call => call.method)).toEqual([
      'DOM.enable',
      'Overlay.enable',
      'Runtime.evaluate',
      'DOM.describeNode',
      'Overlay.highlightNode',
    ])
    expect(calls.find(call => call.method === 'Runtime.evaluate')?.commandParams).toMatchObject({
      expression: expect.stringContaining('querySelector'),
    })
    expect(calls.find(call => call.method === 'Overlay.highlightNode')?.commandParams).toMatchObject({
      backendNodeId: 42,
    })
  })

  it('hides the active debugger overlay immediately when hover ends', async () => {
    const { calls, debuggerApi } = createDebuggerApi()
    const highlighter = new DevToolsOverlayHighlighter(() => 10, debuggerApi)

    await highlighter.highlight('source-inspect-id')
    await expect(highlighter.hide('source-inspect-id')).resolves.toBe(true)

    expect(calls.map(call => call.method)).toEqual([
      'DOM.enable',
      'Overlay.enable',
      'Runtime.evaluate',
      'DOM.describeNode',
      'Overlay.highlightNode',
      'Overlay.hideHighlight',
      'Runtime.releaseObjectGroup',
    ])
  })

  it('does not highlight synced element data that has no cached DOM object in the current tab', async () => {
    const { calls, debuggerApi } = createDebuggerApi('')
    const highlighter = new DevToolsOverlayHighlighter(() => 10, debuggerApi)

    await expect(highlighter.highlight('remote-inspect-id')).resolves.toBe(false)

    expect(calls.map(call => call.method)).toEqual([
      'DOM.enable',
      'Overlay.enable',
      'Runtime.evaluate',
      'Overlay.hideHighlight',
      'Runtime.releaseObjectGroup',
    ])
  })

  it('does not draw a stale highlight after hover has already been cancelled', async () => {
    const calls: Array<{ commandParams?: object, method: string }> = []
    const evaluated = createDeferred<{ result: { objectId: string } }>()
    const debuggerApi: DebuggerApi = {
      attach: vi.fn(async () => undefined),
      detach: vi.fn(async () => undefined),
      sendCommand: vi.fn(async (_debuggee, method, commandParams) => {
        calls.push({ commandParams, method })

        if (method === 'Runtime.evaluate') {
          return await evaluated.promise
        }

        return {}
      }),
    }
    const highlighter = new DevToolsOverlayHighlighter(() => 10, debuggerApi)

    const highlightPromise = highlighter.highlight('stale-inspect-id')

    await flushPromises()
    await highlighter.hide()

    evaluated.resolve({ result: { objectId: 'stale-node-object-id' } })

    await expect(highlightPromise).resolves.toBe(false)
    expect(calls.map(call => call.method)).toEqual([
      'DOM.enable',
      'Overlay.enable',
      'Runtime.evaluate',
      'Overlay.hideHighlight',
      'Runtime.releaseObjectGroup',
    ])
  })
})

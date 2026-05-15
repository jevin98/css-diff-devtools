import { createResolveSelectedElementExpression } from './inspectedElement'

const DEBUGGER_PROTOCOL_VERSION = '1.3'
const DEBUGGER_OBJECT_GROUP = 'css-diff-devtools-hover'

interface RuntimeEvaluateResponse {
  result?: {
    objectId?: string
  }
}

interface DOMDescribeNodeResponse {
  node?: {
    backendNodeId?: number
  }
}

export interface DebuggerApi {
  attach: typeof chrome.debugger.attach
  detach: typeof chrome.debugger.detach
  sendCommand: typeof chrome.debugger.sendCommand
}

export interface DevToolsOverlayHighlightTarget {
  inspectId: string
  inspectPath?: string
  inspectTabId?: number
}

const unavailableDebuggerApi: DebuggerApi = {
  attach: async () => {
    throw new Error('chrome.debugger is unavailable.')
  },
  detach: async () => undefined,
  sendCommand: async () => {
    throw new Error('chrome.debugger is unavailable.')
  },
}

const HIGHLIGHT_CONFIG = {
  borderColor: { a: 0.7, b: 153, g: 229, r: 255 },
  contentColor: { a: 0.18, b: 220, g: 168, r: 111 },
  marginColor: { a: 0.35, b: 107, g: 178, r: 246 },
  paddingColor: { a: 0.35, b: 125, g: 196, r: 147 },
  showInfo: true,
}

export class DevToolsOverlayHighlighter {
  private attachedDebuggee: chrome.debugger.Debuggee | undefined
  private attachPromise: Promise<void> | undefined
  private activeInspectId: string | undefined
  private desiredInspectId: string | undefined
  private hoverVersion = 0

  constructor(
    private readonly getTabId: () => number | undefined,
    private readonly debuggerApi: DebuggerApi,
  ) {}

  async prepare(target?: Pick<DevToolsOverlayHighlightTarget, 'inspectTabId'>) {
    const debuggee = this.getDebuggee()

    if (!debuggee) {
      return false
    }

    if (typeof target?.inspectTabId === 'number' && target.inspectTabId !== debuggee.tabId) {
      return false
    }

    try {
      await this.ensureAttached(debuggee)
      return true
    }
    catch {
      this.attachedDebuggee = undefined
      this.activeInspectId = undefined
      return false
    }
  }

  async highlight(target: DevToolsOverlayHighlightTarget | string) {
    const highlightTarget = typeof target === 'string' ? { inspectId: target } : target
    const { inspectId } = highlightTarget
    this.desiredInspectId = inspectId
    const hoverVersion = ++this.hoverVersion
    const debuggee = this.getDebuggee()

    if (!debuggee) {
      return false
    }

    if (typeof highlightTarget.inspectTabId === 'number' && highlightTarget.inspectTabId !== debuggee.tabId) {
      return false
    }

    try {
      await this.ensureAttached(debuggee)

      if (!this.isCurrentHighlight(inspectId, hoverVersion)) {
        return false
      }

      const evaluated = await this.sendCommand<RuntimeEvaluateResponse>(
        debuggee,
        'Runtime.evaluate',
        {
          expression: createResolveSelectedElementExpression(inspectId, highlightTarget.inspectPath),
          objectGroup: DEBUGGER_OBJECT_GROUP,
          returnByValue: false,
          silent: true,
        },
      )

      if (!this.isCurrentHighlight(inspectId, hoverVersion)) {
        return false
      }

      const objectId = evaluated.result?.objectId

      if (!objectId) {
        if (this.isCurrentHighlight(inspectId, hoverVersion)) {
          await this.hide()
        }

        return false
      }

      if (!this.isCurrentHighlight(inspectId, hoverVersion)) {
        return false
      }

      const backendNodeId = await this.resolveBackendNodeId(debuggee, objectId)

      await this.sendCommand(debuggee, 'Overlay.highlightNode', {
        highlightConfig: HIGHLIGHT_CONFIG,
        ...(backendNodeId ? { backendNodeId } : { objectId }),
      })

      if (!this.isCurrentHighlight(inspectId, hoverVersion)) {
        await this.hideStaleHighlight(debuggee)
        this.rehighlightDesiredElement()
        return false
      }

      this.activeInspectId = inspectId
      return true
    }
    catch {
      this.attachedDebuggee = undefined
      this.activeInspectId = undefined
      return false
    }
  }

  async hide(inspectId?: string) {
    if (inspectId && this.activeInspectId && this.activeInspectId !== inspectId) {
      return false
    }

    this.desiredInspectId = undefined
    const hoverVersion = ++this.hoverVersion

    if (!this.attachedDebuggee) {
      return false
    }

    try {
      await this.sendCommand(this.attachedDebuggee, 'Overlay.hideHighlight')
      await this.releaseObjectGroup()

      if (hoverVersion === this.hoverVersion) {
        this.activeInspectId = undefined
      }

      return true
    }
    catch {
      this.attachedDebuggee = undefined
      this.activeInspectId = undefined
      return false
    }
  }

  async detach() {
    if (!this.attachedDebuggee) {
      return
    }

    const debuggee = this.attachedDebuggee

    await this.hide()

    try {
      await this.debuggerApi.detach(debuggee)
    }
    catch {}
    finally {
      this.attachedDebuggee = undefined
      this.activeInspectId = undefined
    }
  }

  private getDebuggee(): chrome.debugger.Debuggee | null {
    const tabId = this.getTabId()

    return typeof tabId === 'number' ? { tabId } : null
  }

  private async ensureAttached(debuggee: chrome.debugger.Debuggee) {
    if (this.attachPromise) {
      await this.attachPromise
    }

    if (this.attachedDebuggee?.tabId === debuggee.tabId) {
      return
    }

    if (this.attachedDebuggee) {
      await this.detach()
    }

    this.attachPromise ||= this.debuggerApi
      .attach(debuggee, DEBUGGER_PROTOCOL_VERSION)
      .then(async () => {
        await this.sendCommand(debuggee, 'DOM.enable').catch(() => undefined)
        await this.sendCommand(debuggee, 'Overlay.enable').catch(() => undefined)
        this.attachedDebuggee = debuggee
      })
      .finally(() => {
        this.attachPromise = undefined
      })

    await this.attachPromise
  }

  private async releaseObjectGroup() {
    if (!this.attachedDebuggee) {
      return
    }

    await this.sendCommand(this.attachedDebuggee, 'Runtime.releaseObjectGroup', {
      objectGroup: DEBUGGER_OBJECT_GROUP,
    }).catch(() => undefined)
  }

  private async resolveBackendNodeId(debuggee: chrome.debugger.Debuggee, objectId: string) {
    try {
      const describedNode = await this.sendCommand<DOMDescribeNodeResponse>(
        debuggee,
        'DOM.describeNode',
        { objectId },
      )

      return describedNode.node?.backendNodeId
    }
    catch {
      return undefined
    }
  }

  private isCurrentHighlight(inspectId: string, hoverVersion: number) {
    return this.hoverVersion === hoverVersion && this.desiredInspectId === inspectId
  }

  private async hideStaleHighlight(debuggee: chrome.debugger.Debuggee) {
    await this.sendCommand(debuggee, 'Overlay.hideHighlight').catch(() => undefined)
    await this.releaseObjectGroup()
    this.activeInspectId = undefined
  }

  private rehighlightDesiredElement() {
    const inspectId = this.desiredInspectId

    if (inspectId) {
      void this.highlight(inspectId)
    }
  }

  private async sendCommand<T = object>(
    debuggee: chrome.debugger.Debuggee,
    method: string,
    commandParams?: object,
  ): Promise<T> {
    return await this.debuggerApi.sendCommand(debuggee, method, commandParams) as T
  }
}

export const devToolsOverlayHighlighter = new DevToolsOverlayHighlighter(
  () => browser.devtools.inspectedWindow.tabId,
  typeof chrome !== 'undefined' && chrome.debugger ? chrome.debugger : unavailableDebuggerApi,
)

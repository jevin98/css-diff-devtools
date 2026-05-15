import type { CssDiffsType, SelectedElType } from '../types'
import { useClipboard } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { t } from '../lang'
import SM from '../message'
import { type CaptureSelectedElementResult, compareStyles, createCaptureSelectedElementScript, devToolsOverlayHighlighter, getVisibleCssDiffs, UNDEFINED_STYLE_VALUE } from '../utils'

export function useDevToolsPanel() {
  const inputValue = ref('')

  const selectedEl: Array<SelectedElType> = reactive([])
  const cssDiffs: Array<CssDiffsType> = reactive([])

  const isAllProperty = ref(false)

  onMounted(() => {
    browser.devtools.panels.elements.onSelectionChanged.addListener(() => {
      const valueType = getAvailableValueType()

      if (!valueType) {
        return
      }

      browser.devtools.inspectedWindow.eval(
        createCaptureSelectedElementScript(valueType),
        (payload: CaptureSelectedElementResult, isException) => {
          if (!isException && payload?.readyState === 'complete' && payload.result != null) {
            saveSelectedEl({
              ...payload.result,
              inspectId: payload.inspectId,
              inspectPath: payload.inspectPath,
              inspectTabId: browser.devtools.inspectedWindow.tabId,
              valueType,
            })
          }
        },
      )
    })

    // Receive the <selected element> transmitted from the tab being operated
    browser.runtime.onMessage.addListener((data: Array<SelectedElType>) => {
      selectedEl.length = 0

      if (!data.length) {
        cssDiffs.length = 0
        return
      }

      selectedEl.push(...data)

      if (selectedEl.length === 2) {
        compareSelectedEl()
        prepareSelectedElementOverlay()
      }
      else {
        cssDiffs.length = 0
      }
    })
  })

  onUnmounted(() => {
    devToolsOverlayHighlighter.detach()
  })

  function saveSelectedEl(result: SelectedElType) {
    if (!getAvailableValueType()) {
      return
    }

    selectedEl.push(result)

    // Send selected data to other windows/tabs
    SM.send(selectedEl)

    if (selectedEl.length === 2) {
      compareSelectedEl()
      prepareSelectedElementOverlay()
    }
  }

  function handleClearSelection() {
    selectedEl.length = 0
    cssDiffs.length = 0
    devToolsOverlayHighlighter.detach()

    // Send selected data to other windows/tabs
    SM.send([])
  }

  function handleRemoveSelectedElement(valueType: SelectedElType['valueType']) {
    const index = selectedEl.findIndex(element => element.valueType === valueType)

    if (index === -1) {
      return
    }

    selectedEl.splice(index, 1)
    cssDiffs.length = 0
    devToolsOverlayHighlighter.detach()

    // Send selected data to other windows/tabs
    SM.send(selectedEl)
  }

  function getAvailableValueType(): SelectedElType['valueType'] | null {
    if (!selectedEl.some(element => element.valueType === 'left')) {
      return 'left'
    }

    if (!selectedEl.some(element => element.valueType === 'right')) {
      return 'right'
    }

    return null
  }

  function compareSelectedEl() {
    const leftElement = selectedEl.find(element => element.valueType === 'left')
    const rightElement = selectedEl.find(element => element.valueType === 'right')

    if (!leftElement || !rightElement) {
      cssDiffs.length = 0
      return
    }

    const { style: styles1 = {} } = leftElement
    const { style: styles2 = {} } = rightElement

    cssDiffs.length = 0
    cssDiffs.push(...compareStyles(styles1, styles2))
  }

  const renderCssDiffs = computed(() => {
    return getVisibleCssDiffs(cssDiffs, {
      isAllProperty: isAllProperty.value,
      inputValue: inputValue.value,
    })
  })

  async function handleCopyStyle(row: CssDiffsType, valueType: 'left' | 'right') {
    const value = row[valueType] === UNDEFINED_STYLE_VALUE ? t('undefinedStyleValue') : row[valueType]
    const source = `${row.property}: ${value};`

    const { copy } = useClipboard({
      read: true,
      source,
      legacy: true,
    })

    await copy(source)
    toast.success(`${t('copyInfo')} > ${source}`)
  }

  function prepareSelectedElementOverlay() {
    const inspectedTabId = browser.devtools.inspectedWindow.tabId
    const localElement = selectedEl.find(element => element.inspectTabId === inspectedTabId)

    if (!localElement) {
      return
    }

    devToolsOverlayHighlighter.prepare({
      inspectTabId: localElement.inspectTabId,
    })
  }

  function handleInspectSelectedElement(element: SelectedElType) {
    if (!element.inspectId) {
      return
    }

    devToolsOverlayHighlighter.highlight({
      inspectId: element.inspectId,
      inspectPath: element.inspectPath,
      inspectTabId: element.inspectTabId,
    })
  }

  function handleRestoreInspectedElement(element: SelectedElType) {
    if (!element.inspectId) {
      return
    }

    devToolsOverlayHighlighter.hide()
  }

  return {
    inputValue,

    selectedEl,
    cssDiffs,
    renderCssDiffs,
    isAllProperty,
    handleClearSelection,
    handleRemoveSelectedElement,
    handleCopyStyle,
    handleInspectSelectedElement,
    handleRestoreInspectedElement,
  }
}

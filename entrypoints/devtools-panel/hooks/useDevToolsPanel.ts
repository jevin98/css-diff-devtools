import type { CssDiffsType, SelectedElType } from '../types'
import { useClipboard } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { t } from '../lang'
import SM from '../message'
import { compareStyles, formatStyle, type FormatStyleValue, getVisibleCssDiffs, UNDEFINED_STYLE_VALUE } from '../utils'

export function useDevToolsPanel() {
  const inputValue = ref('')

  const selectedEl: Array<SelectedElType> = reactive([])
  const cssDiffs: Array<CssDiffsType> = reactive([])

  const isAllProperty = ref(false)
  const isLoadComplete = ref(false)

  onMounted(() => {
    browser.devtools.panels.elements.onSelectionChanged.addListener(() => {
      browser.devtools.inspectedWindow.eval(
        `(() => document.readyState)($0)`,
        (readyState: Document['readyState']) => {
          if (readyState === 'complete') {
            isLoadComplete.value = true
          }
          else {
            isLoadComplete.value = false
          }
        },
      )

      browser.devtools.inspectedWindow.eval(
        `(${formatStyle.toString()})($0)`,
        (result: FormatStyleValue, isException) => {
          if (!isException && result != null && isLoadComplete.value) {
            const valueType = getAvailableValueType()

            if (valueType) {
              saveSelectedEl({ ...result, valueType })
            }
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
      }
      else {
        cssDiffs.length = 0
      }
    })
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
    }
  }

  function handleClearSelection() {
    selectedEl.length = 0
    cssDiffs.length = 0

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

  return {
    inputValue,

    selectedEl,
    cssDiffs,
    renderCssDiffs,
    isAllProperty,
    handleClearSelection,
    handleRemoveSelectedElement,
    handleCopyStyle,
  }
}

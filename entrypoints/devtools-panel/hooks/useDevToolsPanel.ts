import type { CssDiffsType, SelectedElType } from '../types'
import { useClipboard } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { t } from '../lang'
import SM from '../message'
import { compareStyles, formatStyle, type FormatStyleValue, getVisibleCssDiffs } from '../utils'

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
            const valueType = !selectedEl.length ? 'left' : 'right'

            saveSelectedEl({ ...result, valueType })
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
    })
  })

  function saveSelectedEl(result: SelectedElType) {
    if (selectedEl.length === 2) {
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

  function compareSelectedEl() {
    const [{ style: styles1 = {} }, { style: styles2 = {} }] = selectedEl

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
    const source = `${row.property}: ${row[valueType]};`

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
    handleCopyStyle,
  }
}

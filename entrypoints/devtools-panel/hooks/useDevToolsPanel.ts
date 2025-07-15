import type { CssDiffsType, SelectedElType } from '../types'
import { useClipboard } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import SM from '../message'
import { formatStyle, type FormatStyleValue } from '../utils'

export function useDevToolsPanel() {
  const { t } = useI18n()
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

    const diffs: Array<CssDiffsType> = []

    const allProperties = new Set([
      ...Object.keys(styles1),
      ...Object.keys(styles2),
    ])

    allProperties.forEach((property) => {
      const left = styles1[property] || '未定义'
      const right = styles2[property] || '未定义'

      diffs.push({
        property,
        left,
        right,
        isDiff: left !== right,
      })
    })

    cssDiffs.push(...diffs)
  }

  const renderCssDiffs = computed(() => {
    return inputValueFilter(isAllProperty.value
      ? cssDiffs
      : cssDiffs.filter(css => css.isDiff), inputValue.value)
  })

  function inputValueFilter(cssDiffs: Array<CssDiffsType>, inputValue: string) {
    return !inputValue
      ? cssDiffs
      : cssDiffs.filter(c => c.property.includes(inputValue))
  }

  function onTableCellClassName({ columnIndex }: { columnIndex: number }) {
    return !columnIndex ? 'text-[var(--el-table-text-color)] cursor-auto' : ''
  }

  function onTableRowClassName({ row }: { row: CssDiffsType }) {
    if (row.isDiff) {
      return '!bg-[#ffe6e6] text-[red] cursor-pointer'
    }
    else {
      return '!bg-[#e6ffe6] text-[green] cursor-pointer'
    }
  }

  function handleCopyStyle(row: CssDiffsType, column: any) {
    if (column.property !== 'property') {
      const source = `${row.property}: ${row[column.property as 'left' | 'right']};`

      const { text, copied, copy } = useClipboard({
        read: true,
        source,
        legacy: true,
      })

      copy(source)

      watch(
        () => copied.value,
        (copied) => {
          if (copied) {
            ElMessage({
              message: `${t('copyInfo')} > ${text.value}`,
              type: 'success',
            })
          }
        },
        {
          immediate: true,
        },
      )
    }
  }

  return {
    inputValue,

    selectedEl,
    renderCssDiffs,
    isAllProperty,
    handleClearSelection,
    onTableCellClassName,
    onTableRowClassName,
    handleCopyStyle,
  }
}

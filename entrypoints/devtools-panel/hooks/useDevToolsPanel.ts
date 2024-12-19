import type { CssDiffsType, SelectedElType } from '../types'
import { formatStyle, type FormatStyleValue } from '../utils'

export function useDevToolsPanel() {
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
            saveSelectedEl(result)
          }
        },
      )
    })
  })

  function saveSelectedEl(result: FormatStyleValue) {
    if (selectedEl.length === 2) {
      return
    }

    const valueType = !selectedEl.length ? 'left' : 'right'
    selectedEl.push({ ...result, valueType })

    if (selectedEl.length === 2) {
      compareSelectedEl()
    }
  }

  function handleClearSelection() {
    selectedEl.length = 0
    cssDiffs.length = 0
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
    return isAllProperty.value
      ? cssDiffs
      : cssDiffs.filter(css => css.isDiff)
  })

  function onTableCellClassName({ columnIndex }: { columnIndex: number }) {
    if (!columnIndex) {
      return 'text-[var(--el-table-text-color)]'
    }
  }

  function onTableRowClassName({ row }: { row: CssDiffsType }) {
    if (row.isDiff) {
      return '!bg-[#ffe6e6] text-[red]'
    }
    else {
      return '!bg-[#e6ffe6] text-[green]'
    }
  }

  return {
    selectedEl,
    renderCssDiffs,
    isAllProperty,
    handleClearSelection,
    onTableCellClassName,
    onTableRowClassName,
  }
}

<script setup lang="ts">
import { ElBacktop, ElButton, ElCheckbox, ElIcon, ElOption, ElSelect, ElTable, ElTableColumn, ElText, ElTooltip } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { formatStyle, type FormatStyleValue } from './formatStyle'

type SelectedElType = {
  valueType: 'left' | 'right'
} & FormatStyleValue

interface CssDiffsType {
  property: string
  left: string
  right: string
  isDiff: boolean
}

const selectedEl: Array<SelectedElType> = reactive([])
const cssDiffs: Array<CssDiffsType> = reactive([])

const isAllProperty = ref(false)
const isLoadComplete = ref(false)

onMounted(() => {
  chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
    chrome.devtools.inspectedWindow.eval(
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

    chrome.devtools.inspectedWindow.eval(
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
  if (selectedEl.length === 2)
    return

  const valueType = !selectedEl.length ? 'left' : 'right'
  selectedEl.push({ ...result, valueType })

  if (selectedEl.length === 2) {
    compareSelectedEl()
  }
}

function clearSelection() {
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

function tableCellClassName({ columnIndex }: { columnIndex: number }) {
  if (!columnIndex) {
    return 'text-[var(--el-table-text-color)]'
  }
}

function tableRowClassName({ row }: { row: CssDiffsType }) {
  if (row.isDiff) {
    return '!bg-[#ffe6e6] text-[red]'
  }
  else {
    return '!bg-[#e6ffe6] text-[green]'
  }
}

function filterJoin(...arg: Array<any>) {
  return arg.filter(Boolean).join(' $$ ')
}
</script>

<template>
  <div class="relative">
    <h2 class="font-bold text-center text-lg">
      DOM Diff
    </h2>

    <ElSelect v-model="$i18n.locale" class="!w-[100px] !absolute !right-0 !top-0" size="small">
      <ElOption v-for="locale in $i18n.availableLocales" :key="`locale-${locale}`" :value="locale">
        {{ locale }}
      </ElOption>
    </ElSelect>

    <ElText class="block" type="primary">
      {{ $t('info') }}
    </ElText>

    <ElButton class="mt-[10px]" type="warning" plain @click="clearSelection">
      {{ $t('removeBtn') }}
    </ElButton>

    <ElText v-if="!renderCssDiffs.length" class="block !mt-[10px]" type="danger">
      {{ $t('selectedInfo') }}
    </ElText>

    <div class="flex justify-end">
      <ElCheckbox v-model="isAllProperty" :label="$t('isAllProperty')" />
    </div>
    <ElTable
      class="w-full"
      border
      :data="renderCssDiffs"
      :cell-class-name="tableCellClassName"
      :row-class-name="tableRowClassName"
    >
      <ElTableColumn prop="property" :label="$t('property')" />
      <template v-for="(el) in selectedEl" :key="el.valueType">
        <ElTableColumn :prop="el.valueType">
          <template #header>
            <span class="align-middle">{{ filterJoin(el.tag, el.id, el.class) }}</span>

            <ElTooltip :content="$t('tableColumnInfo')" trigger="click">
              <ElIcon class="align-middle ml-[4px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896a448 448 0 0 1 0-896m0 832a384 384 0 0 0 0-768a384 384 0 0 0 0 768m48-176a48 48 0 1 1-96 0a48 48 0 0 1 96 0m-48-464a32 32 0 0 1 32 32v288a32 32 0 0 1-64 0V288a32 32 0 0 1 32-32" /></svg>
              </ElIcon>
            </ElTooltip>
          </template>
        </ElTableColumn>
      </template>
    </ElTable>

    <ElBacktop :right="20" :bottom="30" />
  </div>
</template>

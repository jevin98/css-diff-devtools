<script setup lang="ts">
import { ElBacktop, ElButton, ElCheckbox, ElIcon, ElInput, ElOption, ElSelect, ElTable, ElTableColumn, ElText, ElTooltip } from 'element-plus'
import { defineComponent, h } from 'vue'
import { useDevToolsPanel } from './hooks/useDevToolsPanel'
import { filterJoin } from './utils'

const {
  inputValue,

  selectedEl,
  renderCssDiffs,
  isAllProperty,
  handleClearSelection,
  onTableCellClassName,
  onTableRowClassName,
  handleCopyStyle,
} = useDevToolsPanel()

const PropertyNode = defineComponent({
  props: {
    text: {
      type: String,
    },
  },
  setup(props) {
    return () => {
      if (!inputValue.value) {
        return h('div', props.text)
      }
      else {
        const result = inputValue.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const reg = new RegExp(`(${result})`, 'gi')

        const text = props.text!.replace(reg, '<span class=\'text-[#409eff]\'>$1</span>')
        return h('div', { innerHTML: text })
      }
    }
  },
})
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

    <ElButton class="mt-[10px]" type="warning" plain @click="handleClearSelection">
      {{ $t('removeBtn') }}
    </ElButton>

    <ElText v-if="!renderCssDiffs.length" class="block !mt-[10px]" type="danger">
      {{ $t('selectedInfo') }}
    </ElText>

    <div class="flex justify-between my-3">
      <ElInput v-model="inputValue" :placeholder="$t('inputPlaceholder')" clearable class="!w-[50%]" />

      <ElCheckbox v-model="isAllProperty" :label="$t('isAllProperty')" />
    </div>
    <ElTable
      class="w-full"
      border
      :data="renderCssDiffs"
      :cell-class-name="onTableCellClassName"
      :row-class-name="onTableRowClassName"
      @cell-click="handleCopyStyle"
    >
      <ElTableColumn prop="property" :label="$t('property')">
        <template #default="scope">
          <PropertyNode :text="scope.row.property" />
        </template>
      </ElTableColumn>
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

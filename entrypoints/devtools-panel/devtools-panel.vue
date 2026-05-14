<script setup lang="ts">
import type { Theme } from './utils/theme'
import { ArrowUp, Copy, Info, Languages, Moon, Search, Sun, Trash2, X } from 'lucide-vue-next'
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Toaster } from '@/components/ui/sonner'
import { useDevToolsPanel } from './hooks/useDevToolsPanel'
import {
  activeLocale,
  initializeLocale,
  LOCALE_STORAGE_KEY,
  setLocale,
  SUPPORTED_LOCALES,
  t,
} from './lang'
import { filterJoin, getDiffValueClass, getNextTheme, resolveLocale, resolveStoredTheme, scrollToTop, THEME_STORAGE_KEY } from './utils'

const {
  inputValue,
  selectedEl,
  renderCssDiffs,
  isAllProperty,
  handleClearSelection,
  handleCopyStyle,
} = useDevToolsPanel()

const theme = ref<Theme>('light')
const isDark = computed(() => theme.value === 'dark')
const tableColumnCount = computed(() => selectedEl.length + 1)
const tableScrollContainer = ref<HTMLElement | null>(null)

function applyTheme(value: Theme) {
  document.documentElement.classList.toggle('dark', value === 'dark')
}

function handleToggleTheme() {
  theme.value = getNextTheme(theme.value)
  applyTheme(theme.value)
  localStorage.setItem(THEME_STORAGE_KEY, theme.value)
}

function handleLocaleChange(value: string) {
  const locale = resolveLocale(value)

  setLocale(locale)
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

function handleScrollToTop() {
  scrollToTop(tableScrollContainer.value)
}

onMounted(() => {
  initializeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
  theme.value = resolveStoredTheme(localStorage.getItem(THEME_STORAGE_KEY))
  applyTheme(theme.value)
})

const PropertyNode = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (!inputValue.value) {
        return h('span', props.text)
      }

      const escapedInput = inputValue.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const reg = new RegExp(`(${escapedInput})`, 'gi')
      const text = props.text.replace(
        reg,
        '<span class="rounded bg-muted px-0.5 font-semibold text-foreground">$1</span>',
      )

      return h('span', { innerHTML: text })
    }
  },
})
</script>

<template>
  <main class="relative flex h-[calc(100vh-32px)] min-h-0 flex-col gap-3">
    <div class="absolute right-0 top-0 flex items-center gap-2">
      <Select
        :model-value="activeLocale"
        @update:model-value="handleLocaleChange"
      >
        <SelectTrigger
          class="h-8 w-[124px] gap-1 px-2"
          :aria-label="t('switchLanguage')"
          :title="t('switchLanguage')"
        >
          <Languages class="h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="locale in SUPPORTED_LOCALES"
            :key="locale.value"
            :value="locale.value"
          >
            {{ locale.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="handleToggleTheme"
      >
        <Sun v-if="isDark" class="h-4 w-4" />
        <Moon v-else class="h-4 w-4" />
      </Button>
    </div>

    <header class="border-b border-border pb-3 pr-[176px]">
      <div class="min-w-0">
        <h1 class="text-lg font-semibold leading-none tracking-normal text-foreground">
          DOM Diff
        </h1>
        <p class="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
          {{ t('info') }}
        </p>
      </div>
    </header>

    <section class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative min-w-[260px] flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="inputValue"
          class="h-9 pl-9 pr-9"
          :placeholder="t('inputPlaceholder')"
        />
        <Button
          v-if="inputValue"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          aria-label="Clear filter"
          @click="inputValue = ''"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <label
        class="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground"
        for="show-all-properties"
      >
        <Checkbox id="show-all-properties" v-model:checked="isAllProperty" />
        <span>{{ t('isAllProperty') }}</span>
      </label>

      <Button variant="outline" size="sm" @click="handleClearSelection">
        <Trash2 class="h-4 w-4" />
        <span>{{ t('removeBtn') }}</span>
      </Button>
    </section>

    <section class="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
      <div ref="tableScrollContainer" class="css-diff-scrollbar h-full overflow-auto">
        <table class="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead class="sticky top-0 z-10 bg-muted text-muted-foreground">
            <tr class="border-b border-border">
              <th class="w-[220px] px-3 py-2 font-medium">
                {{ t('property') }}
              </th>
              <th
                v-for="el in selectedEl"
                :key="el.valueType"
                class="min-w-[240px] border-l border-border px-3 py-2 font-medium"
              >
                <div class="flex items-center gap-1.5">
                  <span class="truncate">{{ filterJoin(el.tag, el.id, el.class) }}</span>
                  <Popover>
                    <PopoverTrigger as-child>
                      <button
                        type="button"
                        class="inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground transition hover:bg-background hover:text-foreground"
                        :aria-label="t('tableColumnInfo')"
                      >
                        <Info class="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top">
                      {{ t('tableColumnInfo') }}
                    </PopoverContent>
                  </Popover>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!renderCssDiffs.length">
              <td
                :colspan="tableColumnCount"
                class="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                {{ t('selectedInfo') }}
              </td>
            </tr>

            <tr
              v-for="row in renderCssDiffs"
              :key="row.property"
              class="border-b border-border transition-colors last:border-b-0"
              :class="row.isDiff
                ? 'bg-muted/50 text-foreground'
                : 'bg-background text-muted-foreground'"
            >
              <td class="w-[220px] px-3 py-2 align-top font-semibold text-foreground">
                <div class="flex items-start">
                  <PropertyNode :text="row.property" />
                </div>
              </td>
              <td
                v-for="el in selectedEl"
                :key="`${row.property}-${el.valueType}`"
                class="group min-w-[240px] cursor-copy border-l border-border px-3 py-2 align-top transition-colors hover:bg-accent hover:text-accent-foreground"
                :class="row.isDiff ? 'bg-muted/30 font-medium text-foreground' : ''"
                @click="handleCopyStyle(row, el.valueType)"
              >
                <div class="flex items-start justify-between gap-3">
                  <span
                    class="break-all rounded-sm border px-2 py-1 leading-none"
                    :class="getDiffValueClass(row, el.valueType)"
                  >
                    {{ row[el.valueType] }}
                  </span>
                  <Copy class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Button
      variant="outline"
      size="icon"
      class="fixed bottom-6 right-5 h-8 w-8 bg-background/95 shadow-sm"
      aria-label="Back to top"
      @click="handleScrollToTop"
    >
      <ArrowUp class="h-4 w-4" />
    </Button>

    <Toaster position="top-right" />
  </main>
</template>

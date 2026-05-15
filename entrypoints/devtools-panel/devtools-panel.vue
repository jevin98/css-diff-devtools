<script setup lang="ts">
import type { SelectedElType } from './types'
import type { Theme, ThemePreference } from './utils/theme'
import { Copy, Globe, Info, Moon, Search, Sun, Trash2, X } from 'lucide-vue-next'
import { computed, defineComponent, h, onMounted, onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
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
import { filterJoin, getDiffValueClass, getNextTheme, getSystemTheme, resolveAppliedTheme, resolveLocale, resolveStoredTheme, THEME_MEDIA_QUERY, THEME_STORAGE_KEY } from './utils'

const logoUrl = new URL('../../img/logo.png', import.meta.url).href

const {
  inputValue,
  selectedEl,
  cssDiffs,
  renderCssDiffs,
  isAllProperty,
  handleClearSelection,
  handleRemoveSelectedElement,
  handleCopyStyle,
} = useDevToolsPanel()

const themePreference = ref<ThemePreference>('system')
const systemTheme = ref<Theme>('light')
const appliedTheme = computed(() => resolveAppliedTheme(themePreference.value, systemTheme.value))
const isDark = computed(() => appliedTheme.value === 'dark')
let systemThemeQuery: MediaQueryList | undefined

const sourceElement = computed(() => selectedEl.find(el => el.valueType === 'left'))
const targetElement = computed(() => selectedEl.find(el => el.valueType === 'right'))
const changedCount = computed(() => cssDiffs.filter(row => row.isDiff).length)
const totalCount = computed(() => cssDiffs.length)
const visibleCount = computed(() => renderCssDiffs.value.length)
const isReady = computed(() => selectedEl.length === 2)
const statusLabel = computed(() => isReady.value ? t('readyToCompare') : t('waitingSelection'))
const filterModeLabel = computed(() => isAllProperty.value ? t('allProperties') : t('changedOnly'))
const selectionSlots = computed(() => [
  { element: sourceElement.value, index: '01', key: 'source', title: t('sourceElement') },
  { element: targetElement.value, index: '02', key: 'target', title: t('targetElement') },
])
const tableColumnCount = computed(() => selectionSlots.value.length + 1)

function getPropertyHighlightParts(text: string, query: string) {
  if (!query) {
    return [{ isMatch: false, text }]
  }

  const parts: Array<{ isMatch: boolean, text: string }> = []
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let cursor = 0
  let index = lowerText.indexOf(lowerQuery, cursor)

  while (index !== -1) {
    if (index > cursor) {
      parts.push({ isMatch: false, text: text.slice(cursor, index) })
    }

    const end = index + query.length

    parts.push({ isMatch: true, text: text.slice(index, end) })
    cursor = end
    index = lowerText.indexOf(lowerQuery, cursor)
  }

  if (cursor < text.length) {
    parts.push({ isMatch: false, text: text.slice(cursor) })
  }

  return parts
}

function applyTheme(value: Theme) {
  document.documentElement.classList.toggle('dark', value === 'dark')
}

function handleSystemThemeChange(event: MediaQueryListEvent) {
  systemTheme.value = getSystemTheme(event.matches)

  if (themePreference.value === 'system') {
    applyTheme(appliedTheme.value)
  }
}

function handleToggleTheme() {
  const nextTheme = getNextTheme(appliedTheme.value)

  themePreference.value = nextTheme
  applyTheme(nextTheme)
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
}

function handleLocaleChange(value: string) {
  const locale = resolveLocale(value)

  setLocale(locale)
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

function getElementTitle(element?: SelectedElType) {
  return element ? filterJoin(element.tag, element.id, element.class) || element.tag || t('emptyElement') : t('emptyElement')
}

function getElementTagName(element?: SelectedElType) {
  return element?.tag ? element.tag.toUpperCase() : '-'
}

function getElementHeaderLabel(element?: SelectedElType) {
  if (!element) {
    return t('emptyElement')
  }

  if (element.id) {
    return `#${element.id}`
  }

  const firstClassName = element.class?.trim().split(/\s+/).find(Boolean)

  if (firstClassName) {
    return `.${firstClassName}`
  }

  return getElementTagName(element)
}

function getElementValue(value?: string) {
  return value || '-'
}

onMounted(() => {
  initializeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
  systemThemeQuery = window.matchMedia(THEME_MEDIA_QUERY)
  systemTheme.value = getSystemTheme(systemThemeQuery.matches)
  themePreference.value = resolveStoredTheme(localStorage.getItem(THEME_STORAGE_KEY))
  applyTheme(appliedTheme.value)
  systemThemeQuery.addEventListener('change', handleSystemThemeChange)
})

onUnmounted(() => {
  systemThemeQuery?.removeEventListener('change', handleSystemThemeChange)
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

      return h(
        'span',
        { class: 'inline' },
        getPropertyHighlightParts(props.text, inputValue.value).map(part => part.isMatch
          ? h('mark', { class: 'bg-transparent font-semibold text-foreground underline decoration-foreground/30 underline-offset-2' }, part.text)
          : part.text,
        ),
      )
    }
  },
})
</script>

<template>
  <main class="flex h-[calc(100vh-32px)] min-h-0 flex-col bg-background text-foreground">
    <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
      <div class="flex min-w-0 items-center gap-3">
        <img
          :src="logoUrl"
          alt="CSS-Diff logo"
          class="h-8 w-8 shrink-0 rounded-md border border-border bg-background object-cover"
        >
        <div class="min-w-0">
          <h1 class="truncate text-sm font-semibold leading-5 tracking-normal">
            DOM Diff
          </h1>
          <div class="mt-0.5 flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
            <span
              class="h-1.5 w-1.5 shrink-0 rounded-full"
              :class="isReady ? 'bg-foreground' : 'bg-muted-foreground'"
            />
            <span class="truncate">{{ statusLabel }}</span>
            <span class="text-border">/</span>
            <span>{{ selectedEl.length }}/2</span>
          </div>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <div
          data-testid="header-stats"
          class="hidden h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground md:flex"
        >
          <span class="font-medium text-foreground">{{ changedCount }}</span>
          <span>{{ t('changed') }}</span>
          <span class="text-border">/</span>
          <span>{{ totalCount }}</span>
          <span>{{ t('total') }}</span>
        </div>

        <Select
          :model-value="activeLocale"
          @update:model-value="handleLocaleChange"
        >
          <SelectTrigger
            class="w-[116px] gap-1 px-2.5"
            :aria-label="t('switchLanguage')"
            :title="t('switchLanguage')"
          >
            <Globe class="h-3.5 w-3.5" />
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
          data-testid="theme-toggle"
          :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="handleToggleTheme"
        >
          <Sun v-if="isDark" class="h-3.5 w-3.5" />
          <Moon v-else class="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>

    <section class="flex min-h-0 flex-1 flex-col gap-3 p-3 xl:flex-row">
      <aside class="grid shrink-0 grid-cols-1 gap-3 xl:w-[320px] xl:grid-rows-[auto_auto_minmax(0,1fr)]">
        <section class="rounded-md border border-border bg-background">
          <div class="flex items-center justify-between border-b border-border px-3 py-2">
            <div>
              <h2 class="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {{ t('selection') }}
              </h2>
            </div>
            <Button variant="ghost" size="sm" @click="handleClearSelection">
              <Trash2 class="h-3.5 w-3.5" />
              <span>{{ t('removeBtn') }}</span>
            </Button>
          </div>

          <div class="grid gap-2 p-2">
            <div
              v-for="slot in selectionSlots"
              :key="slot.key"
              class="min-w-0 overflow-hidden rounded-md border border-border bg-muted/40 p-3"
              :class="slot.element ? 'text-foreground' : 'text-muted-foreground'"
            >
              <div class="mb-2 flex items-center justify-between gap-2">
                <span class="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
                  {{ slot.index }} / {{ slot.title }}
                </span>
                <div class="flex shrink-0 items-center gap-1">
                  <span
                    class="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    :class="slot.element ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'"
                  >
                    {{ slot.element?.tag || '-' }}
                  </span>
                  <Button
                    v-if="slot.element"
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground hover:text-foreground"
                    :aria-label="t('removeSelectedElement', slot.title)"
                    :title="t('removeSelectedElement', slot.title)"
                    @click="handleRemoveSelectedElement(slot.element.valueType)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div class="block max-w-full truncate text-sm font-semibold">
                {{ getElementTitle(slot.element) }}
              </div>
              <div class="mt-2 grid grid-cols-[44px_minmax(0,1fr)] gap-x-2 gap-y-1 text-[11px]">
                <span class="text-muted-foreground">{{ t('idName') }}</span>
                <span class="truncate">{{ getElementValue(slot.element?.id) }}</span>
                <span class="text-muted-foreground">{{ t('className') }}</span>
                <span class="truncate">{{ getElementValue(slot.element?.class) }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-md border border-border bg-background p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h2 class="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {{ t('filter') }}
            </h2>
            <Button
              variant="outline"
              size="sm"
              class="text-xs"
              :aria-pressed="isAllProperty"
              @click="isAllProperty = !isAllProperty"
            >
              {{ filterModeLabel }}
            </Button>
          </div>

          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="inputValue"
              class="h-8 pl-9 pr-8"
              :placeholder="t('inputPlaceholder')"
            />
            <Button
              v-if="inputValue"
              variant="ghost"
              size="icon"
              class="absolute right-0 top-1/2 -translate-y-1/2"
              aria-label="Clear filter"
              @click="inputValue = ''"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </section>

        <section class="hidden min-h-0 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground xl:block">
          <div class="flex items-center justify-between">
            <span>{{ t('diffs') }}</span>
            <span class="font-medium text-foreground">{{ visibleCount }}</span>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span>{{ t('changed') }}</span>
            <span class="font-medium text-foreground">{{ changedCount }}</span>
          </div>
        </section>
      </aside>

      <section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-background">
        <div class="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border px-3">
          <div class="min-w-0">
            <h2 class="truncate text-sm font-semibold">
              {{ t('diffs') }}
            </h2>
            <p class="text-[11px] text-muted-foreground">
              {{ visibleCount }} {{ t('property') }}
            </p>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span class="flex h-8 items-center rounded-md border border-border px-2.5">
              {{ changedCount }} {{ t('changed') }}
            </span>
            <span class="flex h-8 items-center rounded-md border border-border px-2.5">
              {{ totalCount }} {{ t('total') }}
            </span>
          </div>
        </div>

        <div class="css-diff-scrollbar min-h-0 flex-1 overflow-auto">
          <table
            class="w-full min-w-[860px] border-collapse text-left text-xs"
            :class="!renderCssDiffs.length ? 'h-full' : ''"
          >
            <thead class="sticky top-0 z-10 border-b border-border bg-muted/80 text-muted-foreground backdrop-blur">
              <tr>
                <th class="w-[240px] px-3 py-2 font-medium">
                  {{ t('property') }}
                </th>
                <th
                  v-for="slot in selectionSlots"
                  :key="slot.key"
                  class="min-w-[280px] border-l border-border px-3 py-2 font-medium"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <div class="text-[10px] uppercase tracking-normal text-muted-foreground">
                        {{ slot.title }}
                      </div>
                      <div class="mt-1 flex min-w-0 items-center gap-2">
                        <span class="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-foreground">
                          {{ getElementTagName(slot.element) }}
                        </span>
                        <span class="truncate text-xs font-semibold text-foreground">
                          {{ getElementHeaderLabel(slot.element) }}
                        </span>
                      </div>
                    </div>
                    <Popover>
                      <PopoverTrigger as-child>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
                          :aria-label="t('elementDetails')"
                        >
                          <Info class="h-3.5 w-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" side="bottom">
                        <div class="mb-2 font-semibold text-foreground">
                          {{ t('elementDetails') }}
                        </div>
                        <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-1">
                          <dt class="whitespace-nowrap text-muted-foreground">
                            {{ t('tagName') }}
                          </dt>
                          <dd class="truncate">
                            {{ getElementValue(slot.element?.tag) }}
                          </dd>
                          <dt class="whitespace-nowrap text-muted-foreground">
                            {{ t('idName') }}
                          </dt>
                          <dd class="truncate">
                            {{ getElementValue(slot.element?.id) }}
                          </dd>
                          <dt class="whitespace-nowrap text-muted-foreground">
                            {{ t('className') }}
                          </dt>
                          <dd class="break-all">
                            {{ getElementValue(slot.element?.class) }}
                          </dd>
                          <dt class="whitespace-nowrap text-muted-foreground">
                            {{ t('fullName') }}
                          </dt>
                          <dd class="break-all">
                            {{ getElementTitle(slot.element) }}
                          </dd>
                        </dl>
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="!renderCssDiffs.length" class="h-full">
                <td
                  :colspan="tableColumnCount"
                  class="h-full px-3 text-center align-middle text-sm text-muted-foreground"
                >
                  <span data-testid="diff-empty-state">
                    {{ t('selectedInfo') }}
                  </span>
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
                <td class="w-[240px] px-3 py-2 align-top font-semibold text-foreground">
                  <PropertyNode :text="row.property" />
                </td>
                <td
                  v-for="slot in selectionSlots"
                  :key="`${row.property}-${slot.key}`"
                  class="group min-w-[280px] cursor-copy border-l border-border px-3 py-2 align-top transition-colors hover:bg-accent hover:text-accent-foreground"
                  :class="row.isDiff ? 'bg-muted/30 font-medium text-foreground' : ''"
                  @click="slot.element && handleCopyStyle(row, slot.element.valueType)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <span
                      class="break-all rounded-sm border px-2 py-1 leading-none"
                      :class="slot.element ? getDiffValueClass(row, slot.element.valueType) : 'border-border bg-background text-muted-foreground'"
                    >
                      {{ slot.element ? row[slot.element.valueType] : '-' }}
                    </span>
                    <Copy
                      v-if="slot.element"
                      class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <Toaster position="top-right" />
  </main>
</template>

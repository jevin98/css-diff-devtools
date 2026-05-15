import { ref } from 'vue'
import { browser } from 'wxt/browser'
import enMessages from '../../public/_locales/en/messages.json'
import zhCNMessages from '../../public/_locales/zh_CN/messages.json'
import { formatLocaleMessage, type Locale, resolveLocale } from './utils/locale'

export type MessageKey =
  | 'switchLanguage'
  | 'allProperties'
  | 'changed'
  | 'changedOnly'
  | 'className'
  | 'diffs'
  | 'elementDetails'
  | 'emptyElement'
  | 'filter'
  | 'idName'
  | 'info'
  | 'removeBtn'
  | 'readyToCompare'
  | 'removeSelectedElement'
  | 'selectedInfo'
  | 'selection'
  | 'sourceElement'
  | 'property'
  | 'isAllProperty'
  | 'tableColumnInfo'
  | 'tagName'
  | 'targetElement'
  | 'total'
  | 'copyInfo'
  | 'inputPlaceholder'
  | 'waitingSelection'

const messages = {
  en: enMessages,
  zh_CN: zhCNMessages,
}

export const activeLocale = ref<Locale>('en')

export function initializeLocale(value: string | null, fallback = browser.i18n.getUILanguage()) {
  activeLocale.value = resolveLocale(value ?? fallback)
}

export function setLocale(value: Locale) {
  activeLocale.value = value
}

export function t(key: MessageKey, substitutions?: string | string[]) {
  const message = messages[activeLocale.value][key]?.message || browser.i18n.getMessage(key, substitutions) || key

  return formatLocaleMessage(message, substitutions)
}

export { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from './utils/locale'
export type { Locale } from './utils/locale'

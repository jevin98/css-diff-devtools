import { browser } from 'wxt/browser'

export type MessageKey =
  | 'info'
  | 'removeBtn'
  | 'selectedInfo'
  | 'property'
  | 'isAllProperty'
  | 'tableColumnInfo'
  | 'copyInfo'
  | 'inputPlaceholder'

export function t(key: MessageKey, substitutions?: string | string[]) {
  return browser.i18n.getMessage(key, substitutions) || key
}

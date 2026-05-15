export const SUPPORTED_LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'zh_CN', label: '简体中文' },
] as const

export type Locale = typeof SUPPORTED_LOCALES[number]['value']

export const LOCALE_STORAGE_KEY = 'css-diff-locale'

export function resolveLocale(value: string | null | undefined): Locale {
  const normalized = value?.toLowerCase().replace('_', '-')

  return normalized?.startsWith('zh') ? 'zh_CN' : 'en'
}

export function formatLocaleMessage(message: string, substitutions?: string | string[]) {
  const values = Array.isArray(substitutions)
    ? substitutions
    : substitutions == null
      ? []
      : [substitutions]

  return values.reduce(
    (result, value, index) => result.replaceAll(`$${index + 1}`, () => value),
    message.replaceAll('$$$$', () => '$$'),
  )
}

export type Locale = 'en' | 'zh_CN'

export const LOCALE_STORAGE_KEY = 'css-diff-locale'

export function resolveLocale(value: string | null | undefined): Locale {
  const normalized = value?.toLowerCase().replace('_', '-')

  return normalized?.startsWith('zh') ? 'zh_CN' : 'en'
}

export function getNextLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh_CN' : 'en'
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

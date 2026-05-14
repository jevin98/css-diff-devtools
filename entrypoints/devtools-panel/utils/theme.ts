export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'css-diff-theme'

export function resolveStoredTheme(value: string | null): Theme {
  return value === 'dark' ? 'dark' : 'light'
}

export function getNextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

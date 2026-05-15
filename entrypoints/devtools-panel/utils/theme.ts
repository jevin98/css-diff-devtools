export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

export const THEME_STORAGE_KEY = 'css-diff-theme'
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export function resolveStoredTheme(value: string | null): ThemePreference {
  return value === 'dark' || value === 'light' ? value : 'system'
}

export function resolveAppliedTheme(preference: ThemePreference, systemTheme: Theme): Theme {
  return preference === 'system' ? systemTheme : preference
}

export function getSystemTheme(matchesDark: boolean): Theme {
  return matchesDark ? 'dark' : 'light'
}

export function getNextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

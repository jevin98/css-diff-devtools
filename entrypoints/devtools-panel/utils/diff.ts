import type { CssDiffsType } from '../types'

export type DiffValueTone = 'changed' | 'missing' | 'muted'

export const UNDEFINED_STYLE_VALUE = '未定义'

export function getDiffValueTone(row: CssDiffsType, valueType: 'left' | 'right'): DiffValueTone {
  if (!row.isDiff || valueType === 'left') {
    return 'muted'
  }

  return row[valueType] === UNDEFINED_STYLE_VALUE ? 'missing' : 'changed'
}

export function getDiffValueClass(row: CssDiffsType, valueType: 'left' | 'right') {
  const tone = getDiffValueTone(row, valueType)

  if (tone === 'changed') {
    return 'border-red-600 bg-red-50 font-semibold text-red-700 shadow-[inset_3px_0_0_rgb(220_38_38)] dark:border-red-400 dark:bg-red-950/30 dark:text-red-200'
  }

  if (tone === 'missing') {
    return 'border-dashed border-red-600 bg-red-50 font-semibold text-red-700 shadow-[inset_3px_0_0_rgb(220_38_38)] dark:border-red-400 dark:bg-red-950/30 dark:text-red-200'
  }

  return 'border-border bg-background text-foreground'
}

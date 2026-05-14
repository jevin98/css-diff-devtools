import type { CssDiffsType } from '../types'

export type DiffValueTone = 'changed' | 'missing' | 'muted'

export const UNDEFINED_STYLE_VALUE = '未定义'

export function getDiffValueTone(row: CssDiffsType, valueType: 'left' | 'right'): DiffValueTone {
  if (!row.isDiff) {
    return 'muted'
  }

  return row[valueType] === UNDEFINED_STYLE_VALUE ? 'missing' : 'changed'
}

export function getDiffValueClass(row: CssDiffsType, valueType: 'left' | 'right') {
  const tone = getDiffValueTone(row, valueType)

  if (tone === 'changed') {
    return 'border-foreground bg-foreground font-semibold text-background shadow-sm'
  }

  if (tone === 'missing') {
    return 'border-dashed border-foreground bg-background font-semibold text-foreground shadow-[inset_0_0_0_1px_hsl(var(--foreground))]'
  }

  return 'border-transparent bg-transparent text-muted-foreground'
}

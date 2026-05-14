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
    return 'border-foreground/30 bg-background text-foreground shadow-[inset_3px_0_0_hsl(var(--foreground))]'
  }

  if (tone === 'missing') {
    return 'border-dashed border-foreground/40 bg-muted text-muted-foreground shadow-[inset_3px_0_0_hsl(var(--muted-foreground))]'
  }

  return 'border-transparent text-muted-foreground'
}

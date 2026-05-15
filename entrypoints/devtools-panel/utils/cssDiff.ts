import type { CssDiffsType } from '../types'
import { UNDEFINED_STYLE_VALUE } from './diff'

export type CssStyleRecord = Record<string, string | null | undefined>

function normalizeStyleValue(value: string | null | undefined) {
  return value || UNDEFINED_STYLE_VALUE
}

export function compareStyles(
  leftStyles: CssStyleRecord = {},
  rightStyles: CssStyleRecord = {},
): Array<CssDiffsType> {
  const allProperties = new Set([
    ...Object.keys(leftStyles),
    ...Object.keys(rightStyles),
  ])

  return Array.from(allProperties, (property) => {
    const left = normalizeStyleValue(leftStyles[property])
    const right = normalizeStyleValue(rightStyles[property])

    return {
      property,
      left,
      right,
      isDiff: left !== right,
    }
  })
}

export function getVisibleCssDiffs(
  cssDiffs: Array<CssDiffsType>,
  {
    isAllProperty,
    inputValue,
  }: {
    isAllProperty: boolean
    inputValue: string
  },
): Array<CssDiffsType> {
  const source = isAllProperty
    ? cssDiffs
    : cssDiffs.filter(css => css.isDiff)

  return inputValue
    ? source.filter(css => css.property.includes(inputValue))
    : [...source]
}

import type { FormatStyleValue } from './utils'

export type SelectedElType = {
  valueType: 'left' | 'right'
  inspectId?: string
  inspectPath?: string
  inspectTabId?: number
} & FormatStyleValue

export interface CssDiffsType {
  property: string
  left: string
  right: string
  isDiff: boolean
}

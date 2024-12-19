import type { FormatStyleValue } from './utils'

export type SelectedElType = {
  valueType: 'left' | 'right'
} & FormatStyleValue

export interface CssDiffsType {
  property: string
  left: string
  right: string
  isDiff: boolean
}

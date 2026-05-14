import { describe, expect, it } from 'vitest'
import { compareStyles, getVisibleCssDiffs } from '../../entrypoints/devtools-panel/utils/cssDiff'

describe('compareStyles', () => {
  it('marks equal and different CSS properties across the two selections', () => {
    expect(compareStyles(
      { color: 'red', display: 'block' },
      { color: 'red', display: 'inline' },
    )).toEqual([
      { property: 'color', left: 'red', right: 'red', isDiff: false },
      { property: 'display', left: 'block', right: 'inline', isDiff: true },
    ])
  })

  it('keeps properties that only exist on one side and labels the missing side', () => {
    expect(compareStyles(
      { color: 'red' },
      { margin: '4px' },
    )).toEqual([
      { property: 'color', left: 'red', right: '未定义', isDiff: true },
      { property: 'margin', left: '未定义', right: '4px', isDiff: true },
    ])
  })
})

describe('getVisibleCssDiffs', () => {
  const diffs = [
    { property: 'color', left: 'red', right: 'blue', isDiff: true },
    { property: 'display', left: 'block', right: 'block', isDiff: false },
    { property: 'background-color', left: 'red', right: 'green', isDiff: true },
  ]

  it('returns only changed properties by default', () => {
    expect(getVisibleCssDiffs(diffs, { isAllProperty: false, inputValue: '' })).toEqual([
      diffs[0],
      diffs[2],
    ])
  })

  it('can include unchanged properties and filter by property name', () => {
    expect(getVisibleCssDiffs(diffs, { isAllProperty: true, inputValue: 'display' })).toEqual([
      diffs[1],
    ])
  })
})

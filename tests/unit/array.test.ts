import { describe, expect, it } from 'vitest'
import { filterJoin } from '../../entrypoints/devtools-panel/utils/array'

describe('filterJoin', () => {
  it('joins only truthy values with the table header separator', () => {
    expect(filterJoin('DIV', '', undefined, null, 'primary')).toBe('DIV $$ primary')
  })

  it('returns an empty string when all values are absent', () => {
    expect(filterJoin('', undefined, false, null)).toBe('')
  })
})

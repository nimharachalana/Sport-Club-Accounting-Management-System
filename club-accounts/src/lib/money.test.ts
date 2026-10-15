import { describe, it, expect } from 'vitest'
import { toCents, fmt } from './money'

describe('money helpers', () => {
  it('no float drift', () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(toCents(0.3))
  })

  it('converts number and string inputs to integer cents', () => {
    expect(toCents(10.5)).toBe(1050)
    expect(toCents('10.50')).toBe(1050)
    expect(toCents('0.05')).toBe(5)
    expect(toCents(0)).toBe(0)
    expect(toCents(-15.25)).toBe(-1525)
  })

  it('formats positive cents with default currency (Rs.)', () => {
    expect(fmt(1050)).toBe('Rs. 10.50')
    expect(fmt(100000)).toBe('Rs. 1,000.00')
    expect(fmt(0)).toBe('Rs. 0.00')
  })

  it('formats negative cents with unicode minus sign', () => {
    expect(fmt(-2550)).toBe('−Rs. 25.50')
    expect(fmt(-500)).toBe('−Rs. 5.00')
  })

  it('supports custom currency symbols', () => {
    expect(fmt(5000, '$')).toBe('$ 50.00')
    expect(fmt(-5000, '$')).toBe('−$ 50.00')
  })
})

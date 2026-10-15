import { describe, it, expect } from 'vitest'
import { toCents, fromCents, fmt } from './money'

describe('money helpers', () => {
  it('no float drift with toCents', () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(toCents(0.3))
  })

  it('converts number and string inputs to integer cents', () => {
    expect(toCents(10.5)).toBe(1050)
    expect(toCents('10.50')).toBe(1050)
    expect(toCents('0.05')).toBe(5)
    expect(toCents(0)).toBe(0)
    expect(toCents(-15.25)).toBe(-1525)
  })

  it('fromCents converts integer cents back to decimal currency', () => {
    expect(fromCents(1050)).toBe(10.5)
    expect(fromCents(5000000)).toBe(50000)
  })

  it('formats positive currency amounts with default currency (Rs.)', () => {
    expect(fmt(10.5)).toBe('Rs. 10.50')
    expect(fmt(1000)).toBe('Rs. 1,000.00')
    expect(fmt(50000)).toBe('Rs. 50,000.00')
    expect(fmt(0)).toBe('Rs. 0.00')
  })

  it('formats negative currency with unicode minus sign', () => {
    expect(fmt(-25.5)).toBe('−Rs. 25.50')
    expect(fmt(-500)).toBe('−Rs. 500.00')
  })

  it('supports custom currency symbols', () => {
    expect(fmt(50, '$')).toBe('$ 50.00')
    expect(fmt(-50, '$')).toBe('−$ 50.00')
    expect(fmt(750, 'රු.')).toBe('රු. 750.00')
  })

  it('verifies multi-transaction accounting ledger calculations', () => {
    const transactions = [
      { type: 'income', amount: 5000.00 },
      { type: 'expense', amount: 1250.50 },
      { type: 'expense', amount: 450.25 },
      { type: 'income', amount: 2500.00 },
      { type: 'expense', amount: 800.00 },
    ]

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const netBalance = totalIncome - totalExpense

    expect(totalIncome).toBe(7500)
    expect(totalExpense).toBe(2500.75)
    expect(netBalance).toBe(4999.25)
    expect(fmt(netBalance)).toBe('Rs. 4,999.25')
  })
})

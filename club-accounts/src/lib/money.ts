export const toCents = (n: number | string) => Math.round(Number(n) * 100)
export const fromCents = (cents: number) => cents / 100

/**
 * Formats a monetary amount in standard currency decimals (e.g. 50000 -> "Rs. 50,000.00")
 */
export const fmt = (amount: number | string, cur = 'Rs.') => {
  const num = Number(amount) || 0
  return `${num < 0 ? '−' : ''}${cur} ${Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
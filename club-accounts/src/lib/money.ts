export const toCents = (n: number | string) => Math.round(Number(n) * 100)

export const fmt = (cents: number, cur = 'Rs.') =>
  `${cents < 0 ? '−' : ''}${cur} ${(Math.abs(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
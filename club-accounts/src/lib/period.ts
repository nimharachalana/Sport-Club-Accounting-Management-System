export function defaultPeriod(sp: { from?: string; to?: string }) {
  const y = new Date().getFullYear()
  const iso = /^\d{4}-\d{2}-\d{2}$/
  const from = sp.from && iso.test(sp.from) ? sp.from : `${y}-01-01`
  const to = sp.to && iso.test(sp.to) ? sp.to : `${y}-12-31`
  return from <= to ? { from, to } : { from: to, to: from }
}

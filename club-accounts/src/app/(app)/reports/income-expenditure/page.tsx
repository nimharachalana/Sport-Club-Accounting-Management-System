import { Fragment } from 'react'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/reports'
import { defaultPeriod } from '@/lib/period'
import { fmt } from '@/lib/money'
import { ReportShell } from '@/components/report-shell'
import { PeriodForm } from '@/components/period-form'
import { ReportSignatures } from '@/components/reports/report-signatures'

interface RawTransaction {
  id: string
  type: 'income' | 'expense'
  tx_date: string
  amount: number
  party: string | null
  note: string | null
  method: string
  category: { id: string; name_en: string; name_si: string } | null
}

interface SectionGroup {
  heading: string
  items: RawTransaction[]
  subtotal: number
}

function groupTransactionsBySection(list: RawTransaction[]): SectionGroup[] {
  const groups: SectionGroup[] = []
  const map = new Map<string, SectionGroup>()

  for (const tx of list) {
    const p = tx.party?.trim()
    const [y, m, d] = (tx.tx_date || '').split('-')
    const formattedDate = y && m && d ? `${d}/${m}/${y}` : tx.tx_date

    // Detect if party is an event name (e.g. "Inter Batch Meet", "Film Show", dates, parentheses)
    const isEventHeading =
      p &&
      (/meet|faculty|batch|festival|show|night|tournament|championship|ceremony|\(|\//i.test(p) ||
        p.length > 25)

    const heading = isEventHeading ? p : formattedDate

    if (!map.has(heading)) {
      const newGroup: SectionGroup = { heading, items: [], subtotal: 0 }
      map.set(heading, newGroup)
      groups.push(newGroup)
    }

    const g = map.get(heading)!
    g.items.push(tx)
    g.subtotal += Number(tx.amount || 0)
  }

  return groups
}

function renderNoteBullets(note: string | null) {
  if (!note || !note.trim()) return null
  const lines = note
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <div className="space-y-1 text-xs text-neutral-800 dark:text-neutral-200">
      {lines.map((line, idx) => {
        const clean = line.replace(/^[•\-\*]\s*/, '')
        return (
          <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
            <span className="text-neutral-600 dark:text-neutral-400 font-bold select-none">•</span>
            <span>{clean}</span>
          </div>
        )
      })}
    </div>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = defaultPeriod(await searchParams)
  const supabase = await createClient()

  const [locale, s, { data: transactionsData }] = await Promise.all([
    getLocale(),
    getSettings(),
    supabase
      .from('transactions')
      .select(`
        id,
        type,
        tx_date,
        amount,
        party,
        note,
        method,
        category:categories(id, name_en, name_si)
      `)
      .gte('tx_date', from)
      .lte('tx_date', to)
      .order('tx_date', { ascending: true }),
  ])

  // Explicit type cast for Supabase relation result
  const transactions: RawTransaction[] = (transactionsData || []).map((t) => ({
    ...t,
    category: Array.isArray(t.category) ? t.category[0] : t.category,
  }))

  const incomeTxs = transactions.filter((t) => t.type === 'income')
  const expenseTxs = transactions.filter((t) => t.type === 'expense')

  const incomeGroups = groupTransactionsBySection(incomeTxs)
  const expenseGroups = groupTransactionsBySection(expenseTxs)

  const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const totalExpense = expenseTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const net = totalIncome - totalExpense

  const money = (val: number) => fmt(val, s.currency)
  const getCatName = (tx: RawTransaction) => {
    if (!tx.category) return 'General'
    return locale === 'si' && tx.category.name_si ? tx.category.name_si : tx.category.name_en
  }

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <PeriodForm from={from} to={to} />

      {/* Official Report Container */}
      <ReportShell club={s.club_name} title="Income & Expenditure Statement" from={from} to={to}>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg p-4 sm:p-8 space-y-8 shadow-xs print:border-none print:p-0 print:shadow-none [print-color-adjust:exact]">
          {/* 1. Official Faculty Header with Extracted Logo */}
          <div className="flex flex-col items-center justify-center text-center relative pt-2 pb-4 border-b border-neutral-200 dark:border-neutral-800 print:border-none">
            <div className="sm:absolute sm:left-2 sm:top-1/2 sm:-translate-y-1/2 mb-3 sm:mb-0">
              <img
                src="/fot-logo.jpg"
                alt="Faculty of Technology Logo"
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-md shadow-xs border border-neutral-200 dark:border-neutral-800"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 uppercase">
                Sport Club Faculty of Technology
              </h1>
              <div>
                <span className="inline-block rounded-full bg-[#38bdf8] text-neutral-950 font-bold px-6 py-1 text-xs sm:text-sm shadow-xs print:bg-[#38bdf8]!">
                  Income and Expenditure Statement
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500 font-medium">
                Period: {from} &mdash; {to}
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-neutral-500">
              {locale === 'si'
                ? 'මෙම කාලසීමාවේ කිසිදු ගනුදෙනුවක් වාර්තා වී නොමැත.'
                : 'No transactions recorded for the selected period.'}
            </div>
          ) : (
            <div className="space-y-10">
              {/* 2. Operating Income Table */}
              <section className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-neutral-900 dark:border-neutral-700 text-sm border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800 border-b-2 border-neutral-900 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold text-xs uppercase">
                        <th className="py-2.5 px-3 text-left w-52 border-r border-neutral-800">
                          Description
                        </th>
                        <th className="py-2.5 px-3 text-left border-r border-neutral-800">
                          Details / Breakdown
                        </th>
                        <th className="py-2.5 px-3 text-right w-40">
                          Income ( Rs )
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeGroups.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-xs text-neutral-500 italic">
                            No income recorded in this period.
                          </td>
                        </tr>
                      ) : (
                        incomeGroups.map((group, gIdx) => (
                          <Fragment key={gIdx}>
                            {/* Yellow Section Heading Bar */}
                            <tr className="bg-[#fef08a] dark:bg-yellow-300 text-neutral-950 font-bold text-center border-y-2 border-neutral-900 print:bg-[#fef08a]!">
                              <td colSpan={3} className="py-2 px-3 text-center text-xs sm:text-sm font-extrabold tracking-wide">
                                {group.heading}
                              </td>
                            </tr>

                            {/* Section Transactions */}
                            {group.items.map((tx) => {
                              const p = tx.party?.trim()
                              const isDistinctParty = p && p !== group.heading
                              return (
                                <tr
                                  key={tx.id}
                                  className="border-b border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"
                                >
                                  <td className="py-2.5 px-3 align-top font-semibold text-neutral-900 dark:text-neutral-100 border-r border-neutral-800">
                                    <div>{getCatName(tx)}</div>
                                    {isDistinctParty && (
                                      <div className="text-[11px] font-normal text-neutral-500 mt-0.5">
                                        {p}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 align-top border-r border-neutral-800">
                                    {renderNoteBullets(tx.note)}
                                  </td>
                                  <td className="py-2.5 px-3 align-top text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                                    {money(Number(tx.amount))}
                                  </td>
                                </tr>
                              )
                            })}

                            {/* Cyan Section Subtotal Bar */}
                            <tr className="bg-[#7dd3fc] dark:bg-sky-300 text-neutral-950 font-bold border-b-2 border-neutral-900 print:bg-[#7dd3fc]!">
                              <td colSpan={2} className="py-2 px-4 text-center font-bold text-xs sm:text-sm">
                                Total
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums font-bold text-xs sm:text-sm">
                                {money(group.subtotal)}
                              </td>
                            </tr>
                          </Fragment>
                        ))
                      )}
                    </tbody>
                    {/* Grey Grand Total Income Bar */}
                    {incomeGroups.length > 0 && (
                      <tfoot>
                        <tr className="bg-[#9ca3af] dark:bg-neutral-400 text-neutral-950 font-extrabold border-t-2 border-neutral-900 print:bg-[#9ca3af]!">
                          <td colSpan={2} className="py-2.5 px-4 font-extrabold text-sm sm:text-base">
                            Total Income
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-extrabold text-sm sm:text-base">
                            {money(totalIncome)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </section>

              {/* 3. Operating Expenditure Table */}
              <section className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-neutral-900 dark:border-neutral-700 text-sm border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800 border-b-2 border-neutral-900 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold text-xs uppercase">
                        <th className="py-2.5 px-3 text-left w-52 border-r border-neutral-800">
                          Description
                        </th>
                        <th className="py-2.5 px-3 text-left border-r border-neutral-800">
                          Details / Breakdown
                        </th>
                        <th className="py-2.5 px-3 text-right w-40">
                          Expenditure ( Rs )
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseGroups.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-xs text-neutral-500 italic">
                            No expenditure recorded in this period.
                          </td>
                        </tr>
                      ) : (
                        expenseGroups.map((group, gIdx) => (
                          <Fragment key={gIdx}>
                            {/* Yellow Section Heading Bar */}
                            <tr className="bg-[#fef08a] dark:bg-yellow-300 text-neutral-950 font-bold text-center border-y-2 border-neutral-900 print:bg-[#fef08a]!">
                              <td colSpan={3} className="py-2 px-3 text-center text-xs sm:text-sm font-extrabold tracking-wide">
                                {group.heading}
                              </td>
                            </tr>

                            {/* Section Transactions */}
                            {group.items.map((tx) => {
                              const p = tx.party?.trim()
                              const isDistinctParty = p && p !== group.heading
                              return (
                                <tr
                                  key={tx.id}
                                  className="border-b border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"
                                >
                                  <td className="py-2.5 px-3 align-top font-semibold text-neutral-900 dark:text-neutral-100 border-r border-neutral-800">
                                    <div>{getCatName(tx)}</div>
                                    {isDistinctParty && (
                                      <div className="text-[11px] font-normal text-neutral-500 mt-0.5">
                                        {p}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 align-top border-r border-neutral-800">
                                    {renderNoteBullets(tx.note)}
                                  </td>
                                  <td className="py-2.5 px-3 align-top text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                                    {money(Number(tx.amount))}
                                  </td>
                                </tr>
                              )
                            })}

                            {/* Cyan Section Subtotal Bar */}
                            <tr className="bg-[#7dd3fc] dark:bg-sky-300 text-neutral-950 font-bold border-b-2 border-neutral-900 print:bg-[#7dd3fc]!">
                              <td colSpan={2} className="py-2 px-4 text-center font-bold text-xs sm:text-sm">
                                Total
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums font-bold text-xs sm:text-sm">
                                {money(group.subtotal)}
                              </td>
                            </tr>
                          </Fragment>
                        ))
                      )}
                    </tbody>
                    {/* Yellow Grand Total Expenditure Bar */}
                    {expenseGroups.length > 0 && (
                      <tfoot>
                        <tr className="bg-[#fde047] dark:bg-yellow-300 text-neutral-950 font-extrabold border-t-2 border-neutral-900 print:bg-[#fde047]!">
                          <td colSpan={2} className="py-2.5 px-4 font-extrabold text-sm sm:text-base">
                            Total Expenditure
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-extrabold text-sm sm:text-base">
                            {money(totalExpense)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </section>

              {/* 4. Final Accounting Summary Block (Matching Page 6 of PDF) */}
              <section className="pt-2">
                <div className="w-full border-2 border-neutral-900 dark:border-neutral-700 divide-y-2 divide-neutral-900 dark:divide-neutral-700 text-sm sm:text-base font-extrabold">
                  <div className="flex items-center justify-between bg-[#9ca3af] dark:bg-neutral-400 text-neutral-950 px-4 py-2.5 print:bg-[#9ca3af]!">
                    <span>Total Income</span>
                    <span className="tabular-nums text-base sm:text-lg">{money(totalIncome)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#fde047] dark:bg-yellow-300 text-neutral-950 px-4 py-2.5 print:bg-[#fde047]!">
                    <span>Total Expenditure</span>
                    <span className="tabular-nums text-base sm:text-lg">{money(totalExpense)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#4ade80] dark:bg-emerald-400 text-neutral-950 px-4 py-3 print:bg-[#4ade80]!">
                    <span className="text-base sm:text-lg">
                      {net >= 0 ? 'Cash in Hand (Surplus)' : 'Net Deficit'}
                    </span>
                    <span className="tabular-nums text-lg sm:text-xl font-black">
                      {money(Math.abs(net))}
                    </span>
                  </div>
                </div>
              </section>

              {/* 5. Institutional Signatures Block */}
              <ReportSignatures locale={locale} />
            </div>
          )}
        </div>
      </ReportShell>
    </div>
  )
}

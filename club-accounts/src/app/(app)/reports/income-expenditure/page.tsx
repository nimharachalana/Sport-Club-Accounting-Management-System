import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/reports'
import { defaultPeriod } from '@/lib/period'
import { ReportShell } from '@/components/report-shell'
import { PeriodForm } from '@/components/period-form'
import { InteractiveIEReport, type ReportItem } from '@/components/reports/interactive-ie-report'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = defaultPeriod(await searchParams)
  const supabase = await createClient()

  const [s, { data: transactionsData }] = await Promise.all([
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
        category_id,
        category:categories(id, name_en, name_si)
      `)
      .gte('tx_date', from)
      .lte('tx_date', to)
      .order('tx_date', { ascending: true })
      .limit(5000),
  ])

  // Explicit type cast for Supabase relation result
  const transactions: ReportItem[] = (transactionsData || []).map((t) => ({
    ...t,
    category: Array.isArray(t.category) ? t.category[0] : t.category,
  }))

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Date Filter Bar */}
      <PeriodForm from={from} to={to} />

      {/* Official Report Container */}
      <ReportShell club={s.club_name} title="Income & Expenditure Statement" from={from} to={to}>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-2 sm:p-6 md:p-8 space-y-6 sm:space-y-8 shadow-xs print:border-none print:p-0 print:shadow-none [print-color-adjust:exact]">
          {/* Official Faculty Header with Extracted Logo */}
          <div className="flex flex-col items-center justify-center text-center relative pt-2 pb-4 border-b border-neutral-200 dark:border-neutral-800 print:border-none">
            <div className="sm:absolute sm:left-2 sm:top-1/2 sm:-translate-y-1/2 mb-2 sm:mb-0">
              <img
                src="/fot-logo.jpg"
                alt="Faculty of Technology Logo"
                className="h-14 w-14 sm:h-20 sm:w-20 object-contain rounded-md shadow-xs border border-neutral-200 dark:border-neutral-800"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 uppercase">
                Sport Club Faculty of Technology
              </h1>
              <div>
                <span className="inline-block rounded-full bg-[#38bdf8] text-neutral-950 font-bold px-4 sm:px-6 py-0.5 sm:py-1 text-xs sm:text-sm shadow-xs print:bg-[#38bdf8]!">
                  Income and Expenditure Statement
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-500 font-medium">
                Period: {from} &mdash; {to}
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-neutral-500">
              No transactions recorded for the selected period.
            </div>
          ) : (
            <InteractiveIEReport
              initialTransactions={transactions}
              currency={s.currency}
              from={from}
              to={to}
              locale="en"
            />
          )}
        </div>
      </ReportShell>
    </div>
  )
}

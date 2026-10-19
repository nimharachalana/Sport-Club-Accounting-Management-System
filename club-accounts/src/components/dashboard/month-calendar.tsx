"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fmt } from "@/lib/money"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Paperclip,
  Wallet,
  Landmark,
} from "lucide-react"
import type { Transaction } from "@/components/transactions/types"

interface MonthCalendarProps {
  transactions: Transaction[]
  onSelectTransaction?: (tx: Transaction) => void
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export function MonthCalendar({
  transactions,
  onSelectTransaction,
}: MonthCalendarProps) {
  const t = useTranslations("Dashboard")
  const tTx = useTranslations("Transactions")

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  )

  // Map transactions by date string "YYYY-MM-DD"
  const dayStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { income: number; expense: number; count: number; items: Transaction[] }
    >()

    transactions.forEach((tx) => {
      const dateKey = tx.tx_date
      if (!map.has(dateKey)) {
        map.set(dateKey, { income: 0, expense: 0, count: 0, items: [] })
      }
      const stat = map.get(dateKey)!
      stat.count += 1
      stat.items.push(tx)
      if (tx.type === "income") {
        stat.income += tx.amount
      } else {
        stat.expense += tx.amount
      }
    })

    return map
  }, [transactions])

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOffset = getDay(monthStart) // 0 for Sunday, 1 for Monday...

  const selectedDayData = selectedDateStr ? dayStatsMap.get(selectedDateStr) : null

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))
  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDateStr(format(today, "yyyy-MM-dd"))
  }

  const weekdaysList = WEEKDAYS

  return (
    <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs flex flex-col h-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight">
                {t("calendarTitle")}
              </CardTitle>
              <CardDescription className="text-xs">
                {format(currentMonth, "MMMM yyyy")}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-7 px-2 text-[11px] font-medium"
            >
              {t("today")}
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handlePrevMonth}
              className="h-7 w-7 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleNextMonth}
              className="h-7 w-7 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-4">
        {/* Month Grid */}
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekdaysList.map((day, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold text-muted-foreground uppercase py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank cells for offset */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`blank-${i}`} className="h-9 rounded-lg opacity-0" />
            ))}

            {/* Actual Month Days */}
            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const stat = dayStatsMap.get(dateStr)
              const isSelected = selectedDateStr === dateStr
              const isCurrentDay = isToday(day)

              const hasIncome = stat && stat.income > 0
              const hasExpense = stat && stat.expense > 0

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`relative h-10 w-full rounded-xl flex flex-col items-center justify-center text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : isCurrentDay
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
                      : "hover:bg-muted/70 text-foreground"
                  }`}
                >
                  <span className="text-[11px] leading-none">{format(day, "d")}</span>

                  {/* Activity indicators */}
                  {(hasIncome || hasExpense) && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {hasIncome && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-emerald-500"
                          }`}
                        />
                      )}
                      {hasExpense && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-rose-500"
                          }`}
                        />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Day Event Breakdown Details */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span>{t("eventsOnDay")}:</span>
              <span className="text-muted-foreground">{selectedDateStr}</span>
            </span>
            {selectedDayData && (
              <span className="text-[11px] text-muted-foreground">
                {selectedDayData.items.length} {tTx("title")}
              </span>
            )}
          </div>

          {selectedDayData && selectedDayData.items.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {selectedDayData.items.map((tx) => {
                const isIncome = tx.type === "income"
                const catName = tx.category?.name_en || "General"

                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border text-xs hover:bg-muted/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${
                          isIncome
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate max-w-[130px]">
                          {tx.party}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {catName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-semibold tabular-nums ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {isIncome ? "+" : "−"} {fmt(tx.amount)}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                        {tx.method === "bank" ? (
                          <Landmark className="h-2.5 w-2.5" />
                        ) : (
                          <Wallet className="h-2.5 w-2.5" />
                        )}
                        {tx.photos && tx.photos.length > 0 && (
                          <Paperclip className="h-2.5 w-2.5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              <p>{t("noActivity")}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

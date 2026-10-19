"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { fmt } from "@/lib/money"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react"
import type { Transaction } from "@/components/transactions/types"

interface FinancialChartsProps {
  transactions: Transaction[]
}

const CATEGORY_COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#e11d48", // Rose
  "#84cc16", // Lime
  "#64748b", // Slate
]

export function FinancialCharts({ transactions }: FinancialChartsProps) {
  const t = useTranslations("Dashboard")
  const tTx = useTranslations("Transactions")

  // 1. Process Monthly / Time-series Cash Flow Data
  const cashFlowData = useMemo(() => {
    const map = new Map<string, { label: string; income: number; expense: number }>()

    transactions.forEach((tx) => {
      // Group by YYYY-MM
      const monthKey = tx.tx_date.slice(0, 7) // "2026-10"
      if (!map.has(monthKey)) {
        map.set(monthKey, {
          label: monthKey,
          income: 0,
          expense: 0,
        })
      }
      const item = map.get(monthKey)!
      if (tx.type === "income") {
        item.income += tx.amount
      } else {
        item.expense += tx.amount
      }
    })

    // Sort chronologically
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, v]) => ({
        name: v.label,
        income: v.income,
        expense: v.expense,
      }))
  }, [transactions])

  // 2. Process Category Breakdown Data (Expenses by Category)
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>()

    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const catName = tx.category?.name_en || "General"

        const current = map.get(catName) || { name: catName, total: 0 }
        current.total += tx.amount
        map.set(catName, current)
      })

    return Array.from(map.values())
      .map((item) => ({
        name: item.name,
        value: item.total,
      }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const [showAllCategories, setShowAllCategories] = useState(false)

  const totalExpenseAmount = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0)
  }, [categoryData])

  const categoryBreakdownWithPercent = useMemo(() => {
    return categoryData.map((item, idx) => ({
      ...item,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      percent: totalExpenseAmount > 0 ? (item.value / totalExpenseAmount) * 100 : 0,
    }))
  }, [categoryData, totalExpenseAmount])

  const displayCategories = useMemo(() => {
    if (categoryBreakdownWithPercent.length <= 6 || showAllCategories) {
      return categoryBreakdownWithPercent
    }

    const top5 = categoryBreakdownWithPercent.slice(0, 5)
    const remaining = categoryBreakdownWithPercent.slice(5)
    const otherTotal = remaining.reduce((sum, item) => sum + item.value, 0)
    const otherPercent = totalExpenseAmount > 0 ? (otherTotal / totalExpenseAmount) * 100 : 0

    return [
      ...top5,
      {
        name: `Other Categories (${remaining.length} more)`,
        value: otherTotal,
        color: "#64748b",
        percent: otherPercent,
      },
    ]
  }, [categoryBreakdownWithPercent, totalExpenseAmount, showAllCategories])

  const hasCashFlowData = cashFlowData.length > 0
  const hasCategoryData = categoryData.length > 0

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Chart 1: Cash Flow Bar Chart */}
      <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                {t("cashFlow")}
              </CardTitle>
              <CardDescription className="text-xs">
                {tTx("title")} &bull; {tTx("income")} vs. {tTx("expense")}
              </CardDescription>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              Rs.
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {hasCashFlowData ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rs.${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null
                      return (
                        <div className="rounded-xl border bg-popover/95 backdrop-blur-md p-3 shadow-lg text-xs space-y-1">
                          <p className="font-semibold text-popover-foreground">{label}</p>
                          {payload.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                              <span
                                className="font-medium"
                                style={{ color: entry.dataKey === "income" ? "#10b981" : "#f43f5e" }}
                              >
                                {entry.dataKey === "income" ? tTx("income") : tTx("expense")}:
                              </span>
                              <span className="font-semibold tabular-nums">
                                {fmt(entry.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => (
                      <span className="text-xs text-muted-foreground capitalize">
                        {val === "income" ? tTx("income") : tTx("expense")}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="income"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground/60 border border-dashed rounded-xl">
              <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">{t("noCashFlow")}</p>
              <p className="text-xs mt-1 text-muted-foreground">{tTx("clickToAddFirst")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Option A - Modern Horizontal Ranking Breakdown */}
      <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-rose-500" />
                {t("categoryBreakdown")}
              </CardTitle>
              <CardDescription className="text-xs">
                {tTx("expense")} &bull; Ranked by expenditure
              </CardDescription>
            </div>
            {totalExpenseAmount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  {fmt(totalExpenseAmount)}
                </span>
                {categoryBreakdownWithPercent.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((prev) => !prev)}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {showAllCategories ? "Show Top 5" : `All (${categoryBreakdownWithPercent.length})`}
                  </button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
          {hasCategoryData ? (
            <>
              {/* Segmented multi-color overview bar */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden flex shadow-inner">
                  {displayCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="h-full transition-all duration-300 hover:opacity-85"
                      style={{
                        width: `${cat.percent}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`${cat.name}: ${fmt(cat.value)} (${cat.percent.toFixed(1)}%)`}
                    />
                  ))}
                </div>
              </div>

              {/* Ranked category rows */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {displayCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5 group">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-foreground truncate" title={cat.name}>
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground tabular-nums">
                          {cat.percent.toFixed(1)}%
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          {fmt(cat.value)}
                        </span>
                      </div>
                    </div>
                    {/* Modern rounded progress bar */}
                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                        style={{
                          width: `${Math.max(cat.percent, 2)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground/60 border border-dashed rounded-xl">
              <PieIcon className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">{t("noExpenses")}</p>
              <p className="text-xs mt-1 text-muted-foreground">{tTx("clickToAddFirst")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

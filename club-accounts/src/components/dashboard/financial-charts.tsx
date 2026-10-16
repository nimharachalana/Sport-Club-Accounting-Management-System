"use client"

import { useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
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
  "#64748b", // Slate
]

export function FinancialCharts({ transactions }: FinancialChartsProps) {
  const locale = useLocale()
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
        const catName =
          locale === "si" && tx.category?.name_si
            ? tx.category.name_si
            : tx.category?.name_en || "General"

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
  }, [transactions, locale])

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

      {/* Chart 2: Category Breakdown Donut / Pie Chart */}
      <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-emerald-500" />
                {t("categoryBreakdown")}
              </CardTitle>
              <CardDescription className="text-xs">
                {tTx("expense")} &bull; {t("manageReportsDesc")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {hasCategoryData ? (
            <div className="h-[260px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null
                      const item = payload[0]
                      return (
                        <div className="rounded-xl border bg-popover/95 backdrop-blur-md p-2.5 shadow-lg text-xs space-y-1">
                          <p className="font-semibold text-popover-foreground">{item.name}</p>
                          <p className="font-bold text-rose-500 tabular-nums">
                            {fmt(item.payload.value)}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => (
                      <span className="text-xs text-muted-foreground max-w-[120px] truncate inline-block">
                        {val}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
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

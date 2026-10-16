"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fmt } from "@/lib/money"
import { FinancialCharts } from "@/components/dashboard/financial-charts"
import { MonthCalendar } from "@/components/dashboard/month-calendar"
import { TransactionDetailDialog } from "@/components/transactions/transaction-detail-dialog"
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
} from "lucide-react"
import type { Category, Transaction } from "@/components/transactions/types"

interface DashboardClientProps {
  transactions: Transaction[]
  categories: Category[]
  openingCash: number
  openingBank: number
  totalIncome: number
  totalExpense: number
  closingCash: number
  closingBank: number
  currency: string
  isAdmin: boolean
  userName?: string
  clubName?: string
}

export function DashboardClient({
  transactions,
  categories,
  openingCash,
  openingBank,
  totalIncome,
  totalExpense,
  closingCash,
  closingBank,
  currency,
  isAdmin,
}: DashboardClientProps) {
  const t = useTranslations("Dashboard")
  const tTx = useTranslations("Transactions")

  // Transaction Detail Modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const handleSelectTransaction = (tx: Transaction) => {
    setSelectedTx(tx)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Financial Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cash in Hand */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              {t("cashInHand")}
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {fmt(closingCash, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("openingCash")}: {fmt(openingCash, currency)}
            </p>
          </CardContent>
        </Card>

        {/* Bank Balance */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              {t("inBank")}
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Landmark className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {fmt(closingBank, currency)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("openingBank")}: {fmt(openingBank, currency)}
            </p>
          </CardContent>
        </Card>

        {/* Received / Income */}
        <Card className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {t("received")}
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {fmt(totalIncome, currency)}
            </div>
            <p className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70 mt-1">
              {t("currentPeriodIncome")}
            </p>
          </CardContent>
        </Card>

        {/* Paid Out / Expenses */}
        <Card className="rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {t("paidOut")}
            </CardTitle>
            <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {fmt(totalExpense, currency)}
            </div>
            <p className="text-[11px] text-rose-700/70 dark:text-rose-300/70 mt-1">
              {t("currentPeriodExpenses")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Charts on Left & Middle, Activity Calendar on Right */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left & Middle: Financial Charts (2 columns on xl screens) */}
        <div className="xl:col-span-2 space-y-6">
          <FinancialCharts transactions={transactions} />
        </div>

        {/* Right Side: Activity & Event Calendar (1 column on xl screens) */}
        <div className="xl:col-span-1">
          <MonthCalendar
            transactions={transactions}
            onSelectTransaction={handleSelectTransaction}
          />
        </div>
      </div>

      {/* Detail Dialog on click */}
      <TransactionDetailDialog
        transaction={selectedTx}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isAdmin={isAdmin}
      />
    </div>
  )
}

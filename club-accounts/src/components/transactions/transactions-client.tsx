"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { fmt } from "@/lib/money"
import {
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  Paperclip,
  Wallet,
  Landmark,
  FileSpreadsheet,
} from "lucide-react"
import type { Category, Transaction } from "./types"
import { TransactionFormDialog } from "./transaction-form-dialog"
import { TransactionDetailDialog } from "./transaction-detail-dialog"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"

interface TransactionsClientProps {
  initialTransactions: Transaction[]
  categories: Category[]
  isAdmin: boolean
}

export function TransactionsClient({
  initialTransactions,
  categories,
  isAdmin,
}: TransactionsClientProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("Transactions")
  const tCommon = useTranslations("Common")

  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedMethod, setSelectedMethod] = useState<string>("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  // State for modals
  const [formOpen, setFormOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((tx) => {
      // Type filter
      if (selectedType !== "all" && tx.type !== selectedType) {
        return false
      }

      // Category filter
      if (selectedCategory !== "all" && tx.category_id !== selectedCategory) {
        return false
      }

      // Method filter
      if (selectedMethod !== "all" && tx.method !== selectedMethod) {
        return false
      }

      // Date range filter
      if (fromDate && tx.tx_date < fromDate) {
        return false
      }
      if (toDate && tx.tx_date > toDate) {
        return false
      }

      // Search term filter (party, bill_no, note)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const partyMatch = tx.party?.toLowerCase().includes(query)
        const billMatch = tx.bill_no?.toLowerCase().includes(query)
        const noteMatch = tx.note?.toLowerCase().includes(query)
        const categoryEn = tx.category?.name_en?.toLowerCase() || ""
        const categorySi = tx.category?.name_si?.toLowerCase() || ""
        const categoryMatch = categoryEn.includes(query) || categorySi.includes(query)
        if (!partyMatch && !billMatch && !noteMatch && !categoryMatch) {
          return false
        }
      }

      return true
    })
  }, [initialTransactions, selectedType, selectedCategory, selectedMethod, fromDate, toDate, searchTerm])

  // Computed summary metrics
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let income = 0
    let expense = 0

    filteredTransactions.forEach((tx) => {
      if (tx.type === "income") {
        income += tx.amount
      } else {
        expense += tx.amount
      }
    })

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
    }
  }, [filteredTransactions])

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedType !== "all" ||
    selectedCategory !== "all" ||
    selectedMethod !== "all" ||
    fromDate !== "" ||
    toDate !== ""

  const handleResetFilters = () => {
    setSearchTerm("")
    setSelectedType("all")
    setSelectedCategory("all")
    setSelectedMethod("all")
    setFromDate("")
    setToDate("")
  }

  const handleOpenAdd = () => {
    setTransactionToEdit(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (tx: Transaction) => {
    setTransactionToEdit(tx)
    setFormOpen(true)
  }

  const handleOpenDetail = (tx: Transaction) => {
    setSelectedTransaction(tx)
    setDetailOpen(true)
  }

  const handleOpenDelete = (tx: Transaction) => {
    setTransactionToDelete(tx)
    setDeleteOpen(true)
  }

  const handleMutationSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("subTitle")}
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenAdd} className="shadow-xs self-start sm:self-auto cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" />
            {t("addTransaction")}
          </Button>
        )}
      </div>

      {/* Financial Overview Metrics for Filtered Set */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t("filteredIncome")}
              </p>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {fmt(totalIncome)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {t("filteredExpense")}
              </p>
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                {fmt(totalExpense)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("netResult")}
              </p>
              <h3
                className={`text-xl font-bold mt-1 ${
                  netBalance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {fmt(netBalance)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Type Filter */}
            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedType === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("all")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("income")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedType === "income"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("income")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("expense")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedType === "expense"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("expense")}
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all" className="bg-popover text-popover-foreground">
                {t("allCategories")}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                  {locale === "si" && c.name_si ? c.name_si : c.name_en}
                </option>
              ))}
            </select>

            {/* Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all" className="bg-popover text-popover-foreground">
                {t("allMethods")}
              </option>
              <option value="cash" className="bg-popover text-popover-foreground">
                {t("cash")}
              </option>
              <option value="bank" className="bg-popover text-popover-foreground">
                {t("bank")}
              </option>
            </select>
          </div>

          {/* Date range & Reset row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">{t("dates")}:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-7 text-xs w-36"
              />
              <span className="text-muted-foreground">{t("to")}</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-7 text-xs w-36"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("resetFilters")} ({filteredTransactions.length} of {initialTransactions.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              <tr>
                <th className="py-3 px-4">{t("date")}</th>
                <th className="py-3 px-4">{t("type")}</th>
                <th className="py-3 px-4">{t("category")}</th>
                <th className="py-3 px-4">{t("party")}</th>
                <th className="py-3 px-4">{t("method")}</th>
                <th className="py-3 px-4 text-right">{t("amount")}</th>
                <th className="py-3 px-4 text-center">{t("receipts")}</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">{t("noTransactionsFound")}</p>
                    <p className="text-xs mt-1">
                      {hasActiveFilters
                        ? t("tryClearingFilters")
                        : t("clickToAddFirst")}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === "income"
                  const hasPhotos = tx.photos && tx.photos.length > 0

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => handleOpenDetail(tx)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-xs">
                        {tx.tx_date}
                      </td>

                      {/* Type Pill */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
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
                          {isIncome ? t("income") : t("expense")}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-xs">
                          {locale === "si" && tx.category?.name_si
                            ? tx.category.name_si
                            : tx.category?.name_en || "General"}
                        </div>
                      </td>

                      {/* Party */}
                      <td className="py-3 px-4 max-w-[200px] truncate">
                        <span className="font-medium text-xs">{tx.party}</span>
                        {tx.bill_no && (
                          <span className="ml-1.5 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            #{tx.bill_no}
                          </span>
                        )}
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          {tx.method === "bank" ? (
                            <Landmark className="h-3.5 w-3.5" />
                          ) : (
                            <Wallet className="h-3.5 w-3.5" />
                          )}
                          <span>{tx.method === "bank" ? t("bank") : t("cash")}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-4 whitespace-nowrap text-right font-semibold text-xs ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {isIncome ? "+" : "−"} {fmt(tx.amount)}
                      </td>

                      {/* Receipt Indicator */}
                      <td className="py-3 px-4 text-center">
                        {hasPhotos ? (
                          <span
                            title={`${tx.photos!.length} receipt(s) attached`}
                            className="inline-flex items-center text-primary"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenDetail(tx)}
                            title={t("viewDetails")}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleOpenEdit(tx)}
                                title={t("editTransaction")}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleOpenDelete(tx)}
                                title={t("deleteTransaction")}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal Dialog */}
      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        transactionToEdit={transactionToEdit}
        categories={categories}
        onSuccess={handleMutationSuccess}
      />

      {/* Transaction Details Modal Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleOpenEdit}
        isAdmin={isAdmin}
      />

      {/* Delete Confirmation Modal Dialog */}
      <DeleteConfirmDialog
        transaction={transactionToDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleMutationSuccess}
      />
    </div>
  )
}

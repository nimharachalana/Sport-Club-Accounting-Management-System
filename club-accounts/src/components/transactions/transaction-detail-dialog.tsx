"use client"

import { useState, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { fmt } from "@/lib/money"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  User,
  FileText,
  Wallet,
  Landmark,
  Tag,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
} from "lucide-react"
import type { Transaction } from "./types"

interface TransactionDetailDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (transaction: Transaction) => void
  isAdmin?: boolean
}

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
  onEdit,
  isAdmin = false,
}: TransactionDetailDialogProps) {
  const locale = useLocale()
  const t = useTranslations("Transactions")
  const tCommon = useTranslations("Common")
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [loadingUrls, setLoadingUrls] = useState(false)

  // Fetch signed URLs from the private 'bills' bucket whenever transaction with photos is opened
  useEffect(() => {
    let isMounted = true

    async function fetchSignedUrls() {
      if (!open || !transaction || !transaction.photos || transaction.photos.length === 0) {
        setSignedUrls({})
        return
      }

      setLoadingUrls(true)
      const supabase = createClient()
      const paths = transaction.photos.map((p) => p.storage_path)

      try {
        const { data, error } = await supabase.storage
          .from("bills")
          .createSignedUrls(paths, 3600)

        if (error) {
          console.error("Error creating signed URLs:", error)
          return
        }

        if (data && isMounted) {
          const map: Record<string, string> = {}
          data.forEach((item) => {
            if (item.path && item.signedUrl) {
              map[item.path] = item.signedUrl
            }
          })
          setSignedUrls(map)
        }
      } catch (err) {
        console.error("Failed to load signed URLs for photos:", err)
      } finally {
        if (isMounted) setLoadingUrls(false)
      }
    }

    fetchSignedUrls()

    return () => {
      isMounted = false
    }
  }, [open, transaction])

  if (!transaction) return null

  const isIncome = transaction.type === "income"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isIncome
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {isIncome ? (
                  <>
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    {t("income")}
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {t("expense")}
                  </>
                )}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {transaction.tx_date}
              </span>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight mt-2">
            {fmt(transaction.amount)}
          </DialogTitle>
          <DialogDescription className="text-foreground/80 font-medium">
            {transaction.party}
          </DialogDescription>
        </DialogHeader>

        {/* Details Breakdown */}
        <div className="divide-y rounded-xl border bg-card text-sm">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>{t("category")}</span>
            </div>
            <div className="font-medium text-right">
              <div>
                {locale === "si" && transaction.category?.name_si
                  ? transaction.category.name_si
                  : transaction.category?.name_en || "General"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{t("party")}</span>
            </div>
            <span className="font-medium">{transaction.party}</span>
          </div>

          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              {transaction.method === "bank" ? (
                <Landmark className="h-4 w-4" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              <span>{t("method")}</span>
            </div>
            <span className="font-medium">
              {transaction.method === "bank" ? t("bank") : t("cash")}
            </span>
          </div>

          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{t("billNo")}</span>
            </div>
            <span className="font-medium">
              {transaction.bill_no || "—"}
            </span>
          </div>

          {transaction.note && (
            <div className="p-3">
              <div className="text-muted-foreground mb-1">{t("notes")}:</div>
              <p className="text-foreground whitespace-pre-wrap rounded-lg bg-muted/40 p-2 text-xs">
                {transaction.note}
              </p>
            </div>
          )}
        </div>

        {/* Private Bill Photos with Signed URLs */}
        {transaction.photos && transaction.photos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                {t("attachedReceipts")} ({transaction.photos.length})
              </h4>
              <span className="text-[10px] text-muted-foreground">
                Private Bucket
              </span>
            </div>

            {loadingUrls ? (
              <div className="flex items-center justify-center p-6 border rounded-lg bg-muted/20 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {transaction.photos.map((photo) => {
                  const url = signedUrls[photo.storage_path]

                  if (!url) {
                    return (
                      <div
                        key={photo.id}
                        className="aspect-video rounded-lg border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground p-2 text-center"
                      >
                        {tCommon("photoUnavailable")}
                      </div>
                    )
                  }

                  return (
                    <a
                      key={photo.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video overflow-hidden rounded-lg border bg-muted hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={url}
                        alt="Receipt photo"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs gap-1.5 font-medium">
                        <ExternalLink className="h-4 w-4" />
                        {tCommon("viewFull")}
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between items-center gap-2 pt-2">
          {isAdmin && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onEdit(transaction)
              }}
            >
              {t("editTransaction")}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="ml-auto"
          >
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

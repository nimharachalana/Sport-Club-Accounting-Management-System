"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteTransaction } from "@/lib/actions"
import { fmt } from "@/lib/money"
import { toast } from "sonner"
import { AlertTriangle, Loader2 } from "lucide-react"
import type { Transaction } from "./types"

interface DeleteConfirmDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteConfirmDialog({
  transaction,
  open,
  onOpenChange,
  onDeleted,
}: DeleteConfirmDialogProps) {
  const t = useTranslations("Transactions")
  const tCommon = useTranslations("Common")
  const [isDeleting, setIsDeleting] = useState(false)

  if (!transaction) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteTransaction(transaction.id)
      toast.success(t("deletedSuccess"))
      onOpenChange(false)
      if (onDeleted) onDeleted()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete transaction"
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
              <DialogDescription>
                {t("deleteConfirmDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-sm my-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("party")}:</span>
            <span className="font-medium">{transaction.party}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("amount")}:</span>
            <span className="font-semibold text-foreground">{fmt(transaction.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("date")}:</span>
            <span>{transaction.tx_date}</span>
          </div>
          {transaction.photos && transaction.photos.length > 0 && (
            <div className="flex justify-between text-destructive text-xs pt-1">
              <span>{t("attachedReceipts")}:</span>
              <span>{transaction.photos.length} file(s)</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="sm:ml-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("deleting")}
              </>
            ) : (
              tCommon("delete")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

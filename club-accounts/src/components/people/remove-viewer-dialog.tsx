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
import { removeViewer } from "@/lib/actions"
import { toast } from "sonner"
import { UserMinus, Loader2 } from "lucide-react"
import type { ClubPerson } from "./types"

interface RemoveViewerDialogProps {
  person: ClubPerson | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RemoveViewerDialog({
  person,
  open,
  onOpenChange,
  onSuccess,
}: RemoveViewerDialogProps) {
  const t = useTranslations("People")
  const tCommon = useTranslations("Common")
  const [isDeleting, setIsDeleting] = useState(false)

  if (!person) return null

  const handleRemove = async () => {
    setIsDeleting(true)
    try {
      await removeViewer(person.id)
      toast.success(t("removedSuccess"))
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove viewer"
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
              <UserMinus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{t("removeViewerTitle")}</DialogTitle>
              <DialogDescription className="text-xs">
                {t("removeViewerDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm my-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("name")}:</span>
            <span className="font-semibold text-foreground">
              {person.fullName || person.email.split("@")[0]}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("email")}:</span>
            <span className="font-mono text-xs">{person.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("role")}:</span>
            <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {person.role}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={isDeleting}
            className="sm:ml-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("deleting")}
              </>
            ) : (
              t("remove")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

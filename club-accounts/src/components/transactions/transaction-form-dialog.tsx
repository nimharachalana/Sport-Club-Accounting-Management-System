"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import imageCompression from "browser-image-compression"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transaction"
import { createTransaction, updateTransaction, createCategory, updateCategory, deleteCategory } from "@/lib/actions"
import { toCents, fmt } from "@/lib/money"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Upload, Trash2, ArrowDownLeft, ArrowUpRight, Wallet, Landmark, Image as ImageIcon, Plus, X, Pencil, Settings2, AlertCircle, Search } from "lucide-react"
import type { Category, Transaction } from "./types"

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit: Transaction | null
  categories: Category[]
  onSuccess: () => void
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transactionToEdit,
  categories,
  onSuccess,
}: TransactionFormDialogProps) {
  const isEditing = Boolean(transactionToEdit)
  const t = useTranslations("Transactions")
  const tCommon = useTranslations("Common")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<Array<{ id: string; storage_path: string }>>([])
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([])

  // Category management state
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatNameEn, setNewCatNameEn] = useState("")
  const [isCreatingCat, setIsCreatingCat] = useState(false)
  const [showManageCategories, setShowManageCategories] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [editCatNameEn, setEditCatNameEn] = useState("")
  const [isUpdatingCat, setIsUpdatingCat] = useState(false)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null)
  const [isDeletingCat, setIsDeletingCat] = useState(false)

  const todayStr = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      tx_date: todayStr,
      amount: undefined as unknown as number,
      category_id: "",
      party: "",
      bill_no: "",
      method: "cash",
      note: "",
    },
  })

  const currentType = watch("type")
  const currentMethod = watch("method")
  const currentAmount = watch("amount")

  useEffect(() => {
    setLocalCategories((prev) => {
      const map = new Map<string, Category>()
      for (const c of categories) {
        map.set(c.id, c)
      }
      for (const c of prev) {
        if (!map.has(c.id)) {
          map.set(c.id, c)
        }
      }
      return Array.from(map.values())
    })
  }, [categories])

  const filteredCategories = localCategories.filter((c) => c.type === currentType)
  const currentCategoryId = watch("category_id")
  const selectedCategory = filteredCategories.find((c) => c.id === currentCategoryId)

  useEffect(() => {
    if (open) {
      if (transactionToEdit) {
        reset({
          type: transactionToEdit.type,
          tx_date: transactionToEdit.tx_date,
          amount: Number(transactionToEdit.amount),
          category_id: transactionToEdit.category_id,
          party: transactionToEdit.party,
          bill_no: transactionToEdit.bill_no || "",
          method: transactionToEdit.method,
          note: transactionToEdit.note || "",
        })
        setExistingPhotos(transactionToEdit.photos || [])
      } else {
        const defaultCategory = localCategories.find((c) => c.type === "expense")?.id || ""
        reset({
          type: "expense",
          tx_date: todayStr,
          amount: undefined as unknown as number,
          category_id: defaultCategory,
          party: "",
          bill_no: "",
          method: "cash",
          note: "",
        })
        setExistingPhotos([])
      }
      setSelectedFiles([])
      setRemovedPhotoIds([])
      setUploadStatus(null)
      setShowNewCategory(false)
      setNewCatNameEn("")
      setShowManageCategories(false)
      setCategorySearch("")
      setEditingCat(null)
      setEditCatNameEn("")
      setDeletingCat(null)
    }
    // Only re-initialize when the modal opens or transactionToEdit changes.
    // Do NOT include localCategories so adding a category never wipes user-entered data!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transactionToEdit])

  const handleTypeChange = (newType: "income" | "expense") => {
    setValue("type", newType)
    const matching = localCategories.filter((c) => c.type === newType)
    if (matching.length > 0) {
      setValue("category_id", matching[0].id)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCatNameEn.trim()) {
      toast.error("Please enter a category name")
      return
    }
    setIsCreatingCat(true)
    try {
      const created = await createCategory({
        type: currentType,
        name_en: newCatNameEn.trim(),
        name_si: newCatNameEn.trim(),
      })
      setLocalCategories((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev
        return [...prev, created]
      })
      setValue("category_id", created.id, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setNewCatNameEn("")
      setShowNewCategory(false)
      toast.success(t("createCategorySuccess"))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category"
      toast.error(msg)
    } finally {
      setIsCreatingCat(false)
    }
  }

  const handleSaveEditCategory = async () => {
    if (!editingCat || !editCatNameEn.trim()) {
      toast.error("Please enter a category name")
      return
    }
    setIsUpdatingCat(true)
    try {
      await updateCategory(editingCat.id, {
        name_en: editCatNameEn.trim(),
        name_si: editCatNameEn.trim(),
      })
      setLocalCategories((prev) =>
        prev.map((c) =>
          c.id === editingCat.id
            ? { ...c, name_en: editCatNameEn.trim(), name_si: editCatNameEn.trim() }
            : c
        )
      )
      toast.success(`Category renamed to "${editCatNameEn.trim()}"`)
      setEditingCat(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update category"
      toast.error(msg)
    } finally {
      setIsUpdatingCat(false)
    }
  }

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCat) return
    setIsDeletingCat(true)
    try {
      await deleteCategory(deletingCat.id)
      setLocalCategories((prev) => prev.filter((c) => c.id !== deletingCat.id))
      if (watch("category_id") === deletingCat.id) {
        const remaining = filteredCategories.filter((c) => c.id !== deletingCat.id)
        setValue("category_id", remaining.length > 0 ? remaining[0].id : "")
      }
      toast.success(`Category "${deletingCat.name_en}" deleted`)
      setDeletingCat(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category"
      toast.error(msg)
    } finally {
      setIsDeletingCat(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingPhoto = (id: string) => {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== id))
    setRemovedPhotoIds((prev) => [...prev, id])
  }

  const onSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const numericAmount = Number(values.amount)
      let txId: string

      if (isEditing && transactionToEdit) {
        setUploadStatus("Updating transaction details...")
        await updateTransaction(
          transactionToEdit.id,
          {
            type: values.type,
            tx_date: values.tx_date,
            amount: numericAmount,
            category_id: values.category_id,
            party: values.party,
            bill_no: values.bill_no || null,
            method: values.method,
            note: values.note || null,
          },
          removedPhotoIds
        )
        txId = transactionToEdit.id
      } else {
        setUploadStatus("Saving transaction...")
        txId = await createTransaction({
          type: values.type,
          tx_date: values.tx_date,
          amount: numericAmount,
          category_id: values.category_id,
          party: values.party,
          bill_no: values.bill_no || null,
          method: values.method,
          note: values.note || null,
        })
      }

      // Process and upload attached bill photos in browser after transaction exists
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          setUploadStatus(`Compressing & uploading photo ${i + 1} of ${selectedFiles.length}...`)

          // 1. Compress image to max 1600px dimension and <= 0.5 MB
          const small = await imageCompression(file, {
            maxWidthOrHeight: 1600,
            maxSizeMB: 0.5,
            useWebWorker: true,
          })

          // 2. Generate unique path scoped to transaction ID
          const path = `${txId}/${crypto.randomUUID()}.jpg`

          // 3. Upload to private 'bills' storage bucket
          const { error: uploadError } = await supabase.storage
            .from("bills")
            .upload(path, small, { contentType: "image/jpeg" })

          // 4. Record photo storage path in transaction_photos table
          if (!uploadError) {
            await supabase.from("transaction_photos").insert({
              transaction_id: txId,
              storage_path: path,
            })
          } else {
            console.error("Photo upload error:", uploadError)
            toast.error(`Photo upload warning: ${uploadError.message}`)
          }
        }
      }

      toast.success(
        isEditing
          ? t("updatedSuccess")
          : t("createdSuccess")
      )

      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
      setUploadStatus(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editTransaction") : t("addTransaction")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("editTransaction")
              : t("subTitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type Selector */}
          <div className="space-y-1.5">
            <Label>{t("type")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  currentType === "expense"
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-semibold shadow-xs"
                    : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                {t("expense")}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  currentType === "income"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                    : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                {t("income")}
              </button>
            </div>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx_date">{t("date")}</Label>
              <Input
                id="tx_date"
                type="date"
                {...register("tx_date")}
                disabled={isSubmitting}
              />
              {errors.tx_date && <p className="text-xs text-destructive">{errors.tx_date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="font-semibold text-xs">
                {t("amount")}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-muted-foreground pointer-events-none select-none">
                  Rs.
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  onKeyDown={(e) => {
                    if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                      e.preventDefault()
                    }
                  }}
                  {...register("amount", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="pl-9 text-base font-bold tracking-tight h-9"
                />
              </div>
              {currentAmount && !isNaN(Number(currentAmount)) && Number(currentAmount) > 0 ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {t("amountFormatted")}: {fmt(Number(currentAmount))}
                </p>
              ) : errors.amount ? (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              ) : null}
            </div>
          </div>

          {/* Category Dropdown & Add New Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="category_id">{t("category")}</Label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowManageCategories((prev) => !prev)
                    setShowNewCategory(false)
                    setEditingCat(null)
                    setDeletingCat(null)
                  }}
                  className={`inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors ${
                    showManageCategories
                      ? "text-primary font-bold underline"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Manage all categories (search, rename, delete)"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>{showManageCategories ? "Close" : "Manage"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory((prev) => !prev)
                    setShowManageCategories(false)
                    setEditingCat(null)
                    setDeletingCat(null)
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t("addNewCategory")}</span>
                </button>
              </div>
            </div>

            {/* Manage Categories Panel */}
            {showManageCategories && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5 text-primary" />
                    Manage Categories ({currentType === "income" ? t("income") : t("expense")})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManageCategories(false)}
                    className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search category to edit or delete..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="h-7 text-xs pl-8 bg-background"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 pr-1 divide-y divide-border/40">
                  {filteredCategories
                    .filter(
                      (c) =>
                        !categorySearch.trim() ||
                        c.name_en.toLowerCase().includes(categorySearch.toLowerCase())
                    )
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="pt-1.5 pb-1 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-medium text-foreground truncate">{cat.name_en}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-blue-600 cursor-pointer"
                            title={`Rename "${cat.name_en}"`}
                            onClick={() => {
                              setEditingCat(cat)
                              setEditCatNameEn(cat.name_en)
                              setDeletingCat(null)
                              setShowNewCategory(false)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-destructive text-destructive/80 cursor-pointer"
                            title={`Delete "${cat.name_en}"`}
                            onClick={() => {
                              setDeletingCat(cat)
                              setEditingCat(null)
                              setShowNewCategory(false)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {filteredCategories.filter(
                    (c) =>
                      !categorySearch.trim() ||
                      c.name_en.toLowerCase().includes(categorySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-2">
                      No categories found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inline New Category Creator Card */}
            {showNewCategory && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {t("addNewCategory")} ({currentType === "income" ? t("income") : t("expense")})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("categoryNameEn")}</Label>
                  <Input
                    placeholder={t("categoryNameEnPlaceholder")}
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    className="h-8 text-xs bg-background"
                    disabled={isCreatingCat}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCategory(false)}
                    disabled={isCreatingCat}
                    className="h-7 text-xs"
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCat || !newCatNameEn.trim()}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    {isCreatingCat ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        {tCommon("saving")}
                      </>
                    ) : (
                      t("createCategoryBtn")
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Edit Category Card */}
            {editingCat && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Pencil className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Rename Category: <span className="text-blue-600 dark:text-blue-400 font-semibold">{editingCat.name_en}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">New Category Name</Label>
                  <Input
                    value={editCatNameEn}
                    onChange={(e) => setEditCatNameEn(e.target.value)}
                    className="h-8 text-xs bg-background"
                    disabled={isUpdatingCat}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCat(null)}
                    disabled={isUpdatingCat}
                    className="h-7 text-xs"
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveEditCategory}
                    disabled={isUpdatingCat || !editCatNameEn.trim()}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    {isUpdatingCat ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        {tCommon("saving")}
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Delete Category Confirmation Card */}
            {deletingCat && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-bold">
                    Delete Category &ldquo;{deletingCat.name_en}&rdquo;?
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This will permanently delete this category. If any transactions already use this category, deletion will be blocked safely.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingCat(null)}
                    disabled={isDeletingCat}
                    className="h-7 text-xs"
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleConfirmDeleteCategory}
                    disabled={isDeletingCat}
                    className="h-7 text-xs cursor-pointer"
                  >
                    {isDeletingCat ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, Delete"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Dropdown row with quick Edit & Delete for selected category */}
            <div className="flex items-center gap-1.5">
              <select
                id="category_id"
                {...register("category_id")}
                value={currentCategoryId || ""}
                onChange={(e) => {
                  setValue("category_id", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                disabled={isSubmitting}
                className="h-9 flex-1 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled className="bg-popover text-popover-foreground">
                  {t("selectCategoryPlaceholder")}
                </option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                    {c.name_en}
                  </option>
                ))}
              </select>

              {selectedCategory && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={`Rename "${selectedCategory.name_en}"`}
                    onClick={() => {
                      setEditingCat(selectedCategory)
                      setEditCatNameEn(selectedCategory.name_en)
                      setDeletingCat(null)
                      setShowNewCategory(false)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    title={`Delete "${selectedCategory.name_en}"`}
                    onClick={() => {
                      setDeletingCat(selectedCategory)
                      setEditingCat(null)
                      setShowNewCategory(false)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              )}
            </div>
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
          </div>

          {/* Event / Section Heading or Party */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="party">{t("party")}</Label>
              <span className="text-[11px] text-muted-foreground">
                Report Section Heading (e.g. Inter Batch Meet)
              </span>
            </div>
            <Input
              id="party"
              placeholder="e.g. Inter Batch Meet ( 21/02/2026 ), Film Show, or Team name"
              {...register("party")}
              disabled={isSubmitting}
            />
            {errors.party && <p className="text-xs text-destructive">{errors.party.message}</p>}
          </div>

          {/* Payment Method & Bill No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("method")}</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setValue("method", "cash")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    currentMethod === "cash"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {t("cash")}
                </button>
                <button
                  type="button"
                  onClick={() => setValue("method", "bank")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    currentMethod === "bank"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Landmark className="h-3.5 w-3.5" />
                  {t("bank")}
                </button>
              </div>
              {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bill_no">{t("billNo")}</Label>
              <Input
                id="bill_no"
                placeholder={t("billNoPlaceholder")}
                {...register("bill_no")}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Note / Itemized Breakdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="note">{t("notes")}</Label>
              <span className="text-[11px] text-muted-foreground">
                Item breakdown (one per line for bullets)
              </span>
            </div>
            <Textarea
              id="note"
              rows={3}
              placeholder="e.g.&#10;• One Ticket Price- Rs. 100 (Sold-500 Tickets)&#10;• Total cost for Bite"
              {...register("note")}
              disabled={isSubmitting}
            />
          </div>

          {/* Receipt Photos Upload with browser-image-compression */}
          <div className="space-y-2 pt-1 border-t">
            <Label className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                {t("receipts")}
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {t("autoCompressed")}
              </span>
            </Label>

            {/* Existing photos preview in edit mode */}
            {existingPhotos.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">{t("attachedReceipts")}:</span>
                <div className="flex flex-wrap gap-2">
                  {existingPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative h-14 w-14 rounded-lg border bg-muted flex items-center justify-center overflow-hidden group"
                    >
                      <span className="text-[9px] text-muted-foreground truncate px-1">
                        {photo.storage_path.split("/").pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(photo.id)}
                        className="absolute inset-0 bg-destructive/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected new files */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="relative flex items-center gap-1.5 bg-muted/70 border rounded-md px-2 py-1 text-xs"
                  >
                    <span className="truncate max-w-[140px] font-mono text-[11px]">
                      {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(i)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 border border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>{t("selectReceiptsPrompt")}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="hidden"
              />
            </label>
          </div>

          {/* Submission status feedback */}
          {uploadStatus && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/20 rounded-md p-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>{uploadStatus}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="sm:ml-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("saving")}
                </>
              ) : isEditing ? (
                tCommon("saveChanges")
              ) : (
                tCommon("save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

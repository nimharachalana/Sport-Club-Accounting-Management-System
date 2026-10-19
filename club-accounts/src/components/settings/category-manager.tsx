"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions"
import { toast } from "sonner"
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  X,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Category } from "@/components/transactions/types"

interface CategoryManagerProps {
  initialCategories: Category[]
  isAdmin: boolean
}

export function CategoryManager({ initialCategories, isAdmin }: CategoryManagerProps) {
  const tCommon = useTranslations("Common")
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income")
  const [search, setSearch] = useState("")

  // New Category state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEn, setNewEn] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  // Edit Category state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editEn, setEditEn] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Delete Category state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredCategories = categories.filter((c) => {
    if (c.type !== activeTab) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name_en.toLowerCase().includes(q)
  })

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEn.trim()) {
      toast.error("English category name is required.")
      return
    }

    setIsAdding(true)
    try {
      const created = await createCategory({
        type: activeTab,
        name_en: newEn.trim(),
        name_si: newEn.trim(),
      })
      setCategories((prev) => [...prev, created])
      setNewEn("")
      setShowAddForm(false)
      toast.success(`Category "${created.name_en}" created successfully!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category."
      toast.error(msg)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Edit Category
  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c)
    setEditEn(c.name_en)
  }

  const handleSaveEdit = async () => {
    if (!editingCategory || !editEn.trim()) return
    setIsEditing(true)
    try {
      await updateCategory(editingCategory.id, {
        name_en: editEn.trim(),
        name_si: editEn.trim(),
      })
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name_en: editEn.trim(), name_si: editEn.trim() }
            : c
        )
      )
      setEditingCategory(null)
      toast.success("Category updated successfully!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update category."
      toast.error(msg)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle Delete Category
  const handleDeleteCategory = async (c: Category) => {
    if (!confirm(`Are you sure you want to delete category "${c.name_en}"?`)) return
    setDeletingId(c.id)
    try {
      await deleteCategory(c.id)
      setCategories((prev) => prev.filter((item) => item.id !== c.id))
      toast.success(`Category "${c.name_en}" deleted.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category."
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">Accounting Categories</h2>
              <p className="text-xs text-muted-foreground">
                Manage income sources and expenditure heads for financial tracking and statements.
              </p>
            </div>
          </div>

          {isAdmin && (
            <Button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="gap-1.5 cursor-pointer text-xs font-bold self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Category</span>
            </Button>
          )}
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Income vs Expense Toggle */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => {
                setActiveTab("income")
                setShowAddForm(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "income"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>Operating Income ({categories.filter((c) => c.type === "income").length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("expense")
                setShowAddForm(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "expense"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Operating Expenditure ({categories.filter((c) => c.type === "expense").length})</span>
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search category name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs font-medium"
            />
          </div>
        </div>

        {/* Add Category Card (Inline) */}
        {showAddForm && isAdmin && (
          <form
            onSubmit={handleAddCategory}
            className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in-50 duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Add New {activeTab === "income" ? "Income" : "Expenditure"} Category:
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <Label htmlFor="newEn" className="text-xs font-semibold">
                Category Name *
              </Label>
              <Input
                id="newEn"
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                placeholder="e.g. Ticket Sales, Food Stall, Equipment, Ground Maintenance"
                className="h-8 text-xs font-medium"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAdding || !newEn.trim()}
                className="h-7 text-xs font-bold gap-1.5"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{tCommon("saving")}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Create Category</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Categories Table */}
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-bold text-[11px]">
                <th className="py-2.5 px-4 font-semibold">Category Name</th>
                <th className="py-2.5 px-4 font-semibold w-28">Type</th>
                {isAdmin && <th className="py-2.5 px-4 text-right w-24 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 3 : 2} className="py-6 text-center text-muted-foreground italic">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-foreground">{c.name_en}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.type === "income"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {c.type === "income" ? "Income" : "Expenditure"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Edit category"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c)}
                            disabled={deletingId === c.id}
                            className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete category"
                          >
                            {deletingId === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category name for &ldquo;{editingCategory.name_en}&rdquo;.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="editEn" className="text-xs font-semibold">
                  Category Name *
                </Label>
                <Input
                  id="editEn"
                  value={editEn}
                  onChange={(e) => setEditEn(e.target.value)}
                  className="font-medium text-sm"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={isEditing || !editEn.trim()}
                className="gap-1.5 font-bold"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{tCommon("saving")}</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

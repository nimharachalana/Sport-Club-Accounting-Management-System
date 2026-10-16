"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Settings, Building2, PenTool, FolderTree, ShieldAlert, ShieldCheck } from "lucide-react"
import { GeneralSettingsForm } from "./general-settings-form"
import { SignatoriesSettingsForm } from "./signatories-settings-form"
import { CategoryManager } from "./category-manager"
import type { Category } from "@/components/transactions/types"

interface SettingsClientProps {
  initialSettings: {
    club_name: string
    currency: string
    opening_cash?: number
    opening_bank?: number
  }
  categories: Category[]
  isAdmin: boolean
  userRole: string
}

export function SettingsClient({
  initialSettings,
  categories,
  isAdmin,
  userRole,
}: SettingsClientProps) {
  const [activeSection, setActiveSection] = useState<"general" | "signatories" | "categories">("general")

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <span>Club Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure club identity, starting financial balances, default signatories, and accounting categories.
          </p>
        </div>

        {/* Role Badge */}
        <div className="self-start sm:self-auto">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Access &mdash; Full Editing Enabled</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Viewer Role &mdash; Read-Only</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveSection("general")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSection === "general"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>General & Balances</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("signatories")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSection === "signatories"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <PenTool className="h-4 w-4" />
          <span>Report Signatories</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("categories")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSection === "categories"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FolderTree className="h-4 w-4" />
          <span>Categories ({categories.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeSection === "general" && (
          <GeneralSettingsForm initialSettings={initialSettings} isAdmin={isAdmin} />
        )}

        {activeSection === "signatories" && (
          <SignatoriesSettingsForm isAdmin={isAdmin} />
        )}

        {activeSection === "categories" && (
          <CategoryManager initialCategories={categories} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  )
}

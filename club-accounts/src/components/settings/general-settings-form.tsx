"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { updateSettings } from "@/lib/actions"
import { toast } from "sonner"
import { Building2, Coins, Wallet, Landmark, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GeneralSettingsProps {
  initialSettings: {
    club_name: string
    currency: string
    opening_cash?: number
    opening_bank?: number
  }
  isAdmin: boolean
}

export function GeneralSettingsForm({ initialSettings, isAdmin }: GeneralSettingsProps) {
  const t = useTranslations("Common")
  const [clubName, setClubName] = useState(initialSettings.club_name || "Sport Club Faculty of Technology")
  const [currency, setCurrency] = useState(initialSettings.currency || "Rs.")
  const [openingCash, setOpeningCash] = useState<string>(
    initialSettings.opening_cash !== undefined ? String(initialSettings.opening_cash) : "0"
  )
  const [openingBank, setOpeningBank] = useState<string>(
    initialSettings.opening_bank !== undefined ? String(initialSettings.opening_bank) : "0"
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      toast.error("Only administrators can modify settings.")
      return
    }

    if (!clubName.trim()) {
      toast.error("Club name is required.")
      return
    }

    setIsSaving(true)
    try {
      await updateSettings({
        club_name: clubName.trim(),
        currency: currency.trim() || "Rs.",
        opening_cash: Number(openingCash) || 0,
        opening_bank: Number(openingBank) || 0,
      })
      toast.success("Settings saved successfully!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings."
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Club Identity Section */}
      <div className="bg-card border rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Club & University Identity</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="club_name" className="text-xs font-semibold">
              Official Club Name
            </Label>
            <Input
              id="club_name"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="e.g. Sport Club Faculty of Technology"
              disabled={!isAdmin || isSaving}
              className="font-medium"
            />
            <p className="text-[11px] text-muted-foreground">
              Appears on report headers, financial statements, and the navigation bar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-xs font-semibold flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Currency Symbol</span>
            </Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="Rs."
              disabled={!isAdmin || isSaving}
              className="max-w-xs font-semibold"
            />
            <p className="text-[11px] text-muted-foreground">e.g. Rs., LKR, $, €</p>
          </div>
        </div>
      </div>

      {/* Opening Balances Section */}
      <div className="bg-card border rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-foreground">Opening Balances</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Define starting funds on record for cash-in-hand and bank balances before recorded transactions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Cash */}
          <div className="space-y-2">
            <Label htmlFor="opening_cash" className="text-xs font-semibold flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Opening Cash in Hand ({currency})</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                {currency}
              </span>
              <Input
                id="opening_cash"
                type="number"
                step="any"
                min="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                disabled={!isAdmin || isSaving}
                className="pl-10 font-bold"
              />
            </div>
          </div>

          {/* Bank */}
          <div className="space-y-2">
            <Label htmlFor="opening_bank" className="text-xs font-semibold flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Opening Bank Balance ({currency})</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                {currency}
              </span>
              <Input
                id="opening_bank"
                type="number"
                step="any"
                min="0"
                value={openingBank}
                onChange={(e) => setOpeningBank(e.target.value)}
                disabled={!isAdmin || isSaving}
                className="pl-10 font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isAdmin && (
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSaving} className="gap-2 cursor-pointer font-bold px-6">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save General Settings</span>
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}

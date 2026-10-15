import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/settings/settings-client"
import type { Category } from "@/components/transactions/types"

export default async function SettingsPage() {
  const supabase = await createClient()

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 2. Fetch user profile & role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = profile?.role ?? "viewer"
  const isAdmin = role === "admin"

  // 3. Fetch club settings & categories concurrently
  const [{ data: settingsData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("settings")
      .select("club_name, currency, opening_cash, opening_bank")
      .eq("id", 1)
      .single(),
    supabase
      .from("categories")
      .select("id, type, name_en, name_si")
      .order("type", { ascending: true })
      .order("name_en", { ascending: true }),
  ])

  const initialSettings = {
    club_name: settingsData?.club_name || "Sport Club Faculty of Technology",
    currency: settingsData?.currency || "Rs.",
    opening_cash: Number(settingsData?.opening_cash || 0),
    opening_bank: Number(settingsData?.opening_bank || 0),
  }

  const categories: Category[] = (categoriesData || []).map((c) => ({
    id: c.id,
    type: c.type,
    name_en: c.name_en,
    name_si: c.name_si,
  }))

  return (
    <SettingsClient
      initialSettings={initialSettings}
      categories={categories}
      isAdmin={isAdmin}
      userRole={role}
    />
  )
}

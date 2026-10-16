import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import type { Category, Transaction } from "@/components/transactions/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Auth & Profile
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user?.id || "")
    .single()

  // 2. Settings
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .single()

  // 3. Categories
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, type, name_en, name_si")
    .order("name_en")

  const categories: Category[] = categoriesData || []

  // 4. Transactions joined with categories & photos
  const { data: txData } = await supabase
    .from("transactions")
    .select(`
      id,
      type,
      tx_date,
      amount,
      category_id,
      party,
      bill_no,
      method,
      note,
      created_by,
      created_at,
      category:categories(id, type, name_en, name_si),
      photos:transaction_photos(id, transaction_id, storage_path)
    `)
    .order("tx_date", { ascending: false })
    .order("created_at", { ascending: false })

  const transactions: Transaction[] = (txData || []).map((t: any) => ({
    id: t.id,
    type: t.type,
    tx_date: t.tx_date,
    amount: t.amount,
    category_id: t.category_id,
    party: t.party,
    bill_no: t.bill_no,
    method: t.method,
    note: t.note,
    created_by: t.created_by,
    created_at: t.created_at,
    category: Array.isArray(t.category) ? t.category[0] : t.category,
    photos: t.photos || [],
  }))

  // 5. Calculate Financial Balances (standard currency)
  const openingCash = Number(settings?.opening_cash || 0)
  const openingBank = Number(settings?.opening_bank || 0)

  let totalIncome = 0
  let totalExpense = 0
  let netCashDelta = 0
  let netBankDelta = 0

  transactions.forEach((tx) => {
    if (tx.type === "income") {
      totalIncome += tx.amount
      if (tx.method === "bank") {
        netBankDelta += tx.amount
      } else {
        netCashDelta += tx.amount
      }
    } else {
      totalExpense += tx.amount
      if (tx.method === "bank") {
        netBankDelta -= tx.amount
      } else {
        netCashDelta -= tx.amount
      }
    }
  })

  const closingCash = openingCash + netCashDelta
  const closingBank = openingBank + netBankDelta

  const role = profile?.role ?? "viewer"
  const isAdmin = role === "admin"
  const currency = settings?.currency || "Rs."
  const clubName = settings?.club_name || "Sport Club"
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Member"

  return (
    <DashboardClient
      transactions={transactions}
      categories={categories}
      openingCash={openingCash}
      openingBank={openingBank}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      closingCash={closingCash}
      closingBank={closingBank}
      currency={currency}
      isAdmin={isAdmin}
      userName={userName}
      clubName={clubName}
    />
  )
}
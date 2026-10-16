import { createClient } from "@/lib/supabase/server"
import { TransactionsClient } from "@/components/transactions/transactions-client"
import type { Category, Transaction } from "@/components/transactions/types"

export default async function TransactionsPage() {
  const supabase = await createClient()

  // Verify auth session & get role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || ""

  // Fetch profile, categories, and transactions concurrently
  const [
    { data: profile },
    { data: categoriesData, error: catError },
    { data: txData, error: txError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single(),
    supabase
      .from("categories")
      .select("id, type, name_en, name_si")
      .order("name_en"),
    supabase
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
      .order("created_at", { ascending: false }),
  ])

  const isAdmin = profile?.role === "admin"

  if (catError) {
    console.error("Error fetching categories:", catError)
  }

  const categories: Category[] = categoriesData || []

  if (txError) {
    console.error("Error fetching transactions:", txError)
  }

  // Cast returned data to strongly-typed Transaction[]
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

  return (
    <TransactionsClient
      initialTransactions={transactions}
      categories={categories}
      isAdmin={isAdmin}
    />
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AuthProvider } from "@/components/auth-provider"
import { AppShell } from "@/components/app-shell"
import type { Category } from "@/components/transactions/types"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Explicitly call getUser() rather than getSession() to guarantee secure server-side validation
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Read role from the profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", user.id)
    .single()

  const role = profile?.role ?? "viewer"
  const isAdmin = role === "admin"

  // Fetch categories for global transaction creation
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, type, name_en, name_si")
    .order("name_en")

  const categories: Category[] = categoriesData || []

  return (
    <AuthProvider user={user} profile={profile} role={role} isAdmin={isAdmin}>
      <AppShell
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        categories={categories}
      >
        {children}
      </AppShell>
    </AuthProvider>
  )
}

import { Suspense } from "react"
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

  // Fetch profile and categories in parallel
  const [{ data: profile }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("categories")
      .select("id, type, name_en, name_si")
      .order("name_en"),
  ])

  const role = profile?.role ?? "viewer"
  const isAdmin = role === "admin"
  const categories: Category[] = categoriesData || []

  return (
    <AuthProvider user={user} profile={profile} role={role} isAdmin={isAdmin}>
      <AppShell
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        categories={categories}
      >
        <Suspense fallback={<div className="p-8 text-sm text-neutral-400">Loading...</div>}>
          {children}
        </Suspense>
      </AppShell>
    </AuthProvider>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AddTransactionProvider, useAddTransaction } from "@/components/add-transaction-context"
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/components/auth-provider"
import type { Category } from "@/components/transactions/types"

interface AppShellProps {
  user: User
  profile: Profile | null
  isAdmin: boolean
  categories: Category[]
  children: React.ReactNode
}

function AppShellInner({
  user,
  profile,
  isAdmin,
  categories,
  children,
}: AppShellProps) {
  const router = useRouter()
  const { isOpen, openAddModal, closeAddModal } = useAddTransaction()

  return (
    <div className="min-h-screen bg-background">
      {/* Left Sidebar */}
      <AppSidebar
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        onOpenAddTransaction={isAdmin ? openAddModal : undefined}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Add Transaction Dialog */}
      {isAdmin && (
        <TransactionFormDialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) closeAddModal()
          }}
          transactionToEdit={null}
          categories={categories}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

export function AppShell(props: AppShellProps) {
  return (
    <AddTransactionProvider>
      <AppShellInner {...props} />
    </AddTransactionProvider>
  )
}

"use client"

import { createContext, useContext, useState } from "react"

interface AddTransactionContextType {
  isOpen: boolean
  openAddModal: () => void
  closeAddModal: () => void
}

const AddTransactionContext = createContext<AddTransactionContextType>({
  isOpen: false,
  openAddModal: () => {},
  closeAddModal: () => {},
})

export function AddTransactionProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AddTransactionContext.Provider
      value={{
        isOpen,
        openAddModal: () => setIsOpen(true),
        closeAddModal: () => setIsOpen(false),
      }}
    >
      {children}
    </AddTransactionContext.Provider>
  )
}

export function useAddTransaction() {
  return useContext(AddTransactionContext)
}

"use client"

import React, { createContext, useContext } from "react"
import type { User } from "@supabase/supabase-js"

export interface Profile {
  id: string
  full_name?: string | null
  role?: string | null
  created_at?: string | null
}

interface AuthContextType {
  user: User
  profile: Profile | null
  role: string
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  user,
  profile,
  role,
  isAdmin,
  children,
}: {
  user: User
  profile: Profile | null
  role: string
  isAdmin: boolean
  children: React.ReactNode
}) {
  return (
    <AuthContext.Provider value={{ user, profile, role, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useIsAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin
}

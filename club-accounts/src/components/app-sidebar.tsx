"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Receipt,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Languages,
  Plus,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/components/auth-provider"

interface AppSidebarProps {
  user: User
  profile: Profile | null
  isAdmin: boolean
  onOpenAddTransaction?: () => void
}

export function AppSidebar({
  user,
  profile,
  isAdmin,
  onOpenAddTransaction,
}: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("Nav")
  const tTx = useTranslations("Transactions")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === "dark" : false

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const toggleLocale = () => {
    const nextLocale = locale === "si" ? "en" : "si"
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;SameSite=Lax`
    router.refresh()
  }

  const navItems = [
    { label: t("dashboard"), href: "/", icon: LayoutDashboard },
    { label: t("transactions"), href: "/transactions", icon: Receipt },
    { label: t("people"), href: "/people", icon: Users },
    { label: t("reports"), href: "/reports/income-expenditure", icon: BarChart3 },
    { label: t("settings"), href: "/settings", icon: Settings },
  ]

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User"

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 pt-2">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 font-bold tracking-tight group"
          >
            <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-sm shrink-0 border border-emerald-500/25 bg-slate-950 group-hover:scale-105 transition-transform">
              <Image
                src="/fot-logo.jpg"
                alt="Faculty of Technology Logo"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight tracking-tight text-foreground">
                Sport Club
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight font-medium">
                {t("brandSub")}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Action: New Transaction Button */}
        {isAdmin && onOpenAddTransaction && (
          <div className="px-1">
            <Button
              onClick={() => {
                setMobileOpen(false)
                onOpenAddTransaction()
              }}
              className="w-full justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm font-semibold cursor-pointer h-9 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{tTx("addTransaction")}</span>
            </Button>
          </div>
        )}

        {/* Vertical Nav List (Top to Down) */}
        <nav className="space-y-1 px-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground group-hover:text-foreground"
                      }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="pt-4 mt-auto border-t space-y-2.5 px-1">
        {/* Theme Switcher (Directly above Language Switcher) */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-between h-8 px-2.5 rounded-lg border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600 cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-emerald-500" />
            )}
            <span className="text-muted-foreground text-[11px]">{t("theme")}:</span>
          </div>
          <span className="font-semibold capitalize">
            {isDark ? t("dark") : t("light")}
          </span>
        </Button>

        {/* Language Switcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLocale}
          className="w-full justify-between h-8 px-2.5 rounded-lg border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600 cursor-pointer"
          title={locale === "si" ? "Switch to English" : "සිංහල භාෂාවට මාරු වන්න"}
        >
          <div className="flex items-center gap-2">
            <Languages className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground text-[11px]">Language:</span>
          </div>
          <span className={`font-semibold ${locale === "en" ? "font-sinhala" : ""}`}>
            {locale === "en" ? "සිංහල" : "English"}
          </span>
        </Button>

        {/* User Profile Badge */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center shrink-0 border border-emerald-500/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                {user.email}
              </span>
              <div className="mt-1">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {t("admin")}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-medium bg-muted text-muted-foreground border">
                    {t("viewer")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            title={t("signOut")}
            className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
        <Link href="/" className="flex items-center gap-2.5 font-bold">
          <div className="relative h-8 w-8 rounded-lg overflow-hidden shadow-xs shrink-0 border border-emerald-500/25 bg-slate-950">
            <Image
              src="/fot-logo.jpg"
              alt="Faculty of Technology Logo"
              fill
              sizes="32px"
              className="object-cover"
              priority
            />
          </div>
          <span className="text-sm font-bold">Sport Club</span>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && onOpenAddTransaction && (
            <Button
              size="icon-sm"
              onClick={onOpenAddTransaction}
              className="h-8 w-8 bg-emerald-600 text-white rounded-lg cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon-sm"
            onClick={toggleTheme}
            className="h-8 w-8 cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Moon className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-emerald-500" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleLocale}
            className="h-8 px-2 text-xs"
          >
            {locale === "en" ? "සිං" : "EN"}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
            className="h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-72 max-w-[85vw] flex-col bg-background p-4 shadow-xl border-r">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card/60 backdrop-blur-md p-4 z-30 print:hidden">
        {sidebarContent}
      </aside>
    </>
  )
}

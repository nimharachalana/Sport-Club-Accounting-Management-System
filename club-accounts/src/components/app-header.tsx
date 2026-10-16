"use client"

import { usePathname, useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
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
} from "lucide-react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/components/auth-provider"

interface AppHeaderProps {
  user: User
  profile: Profile | null
  isAdmin: boolean
}

export function AppHeader({ user, profile, isAdmin }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("Nav")

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const toggleLocale = () => {
    const nextLocale = locale === "si" ? "en" : "si"
    // Set locale cookie with 1 year expiration
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;SameSite=Lax`
    router.refresh()
  }

  const navItems = [
    { label: t("dashboard"), href: "/", icon: LayoutDashboard },
    { label: t("transactions"), href: "/transactions", icon: Receipt },
    { label: t("people"), href: "/people", icon: Users },
    { label: t("reports"), href: "/reports", icon: BarChart3 },
    ...(isAdmin ? [{ label: t("settings"), href: "/settings", icon: Settings }] : []),
  ]

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <div className="relative h-9 w-9 rounded-xl overflow-hidden shadow-xs shrink-0 border border-emerald-500/25 bg-slate-950">
              <Image
                src="/fot-logo.jpg"
                alt="Faculty of Technology Logo"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-tight">{t("brand")}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {t("brandSub")}
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Language Switcher Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLocale}
            className="h-8 px-2.5 rounded-lg border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
            title={locale === "si" ? "Switch to English" : "සිංහල භාෂාවට මාරු වන්න"}
          >
            <Languages className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            <span className={locale === "en" ? "font-sinhala font-medium" : ""}>
              {locale === "en" ? "සිංහල" : "English"}
            </span>
          </Button>

          {/* User Badge */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium leading-none">{displayName}</span>
            <div className="mt-1 flex items-center gap-1">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  {t("admin")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border">
                  {t("viewer")}
                </span>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            title={t("signOut")}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer h-8"
          >
            <LogOut className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">{t("signOut")}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

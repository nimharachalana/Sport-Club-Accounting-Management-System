"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Languages } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("Auth")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const toggleLocale = () => {
    const nextLocale = locale === "si" ? "en" : "si"
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;SameSite=Lax`
    router.refresh()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage(t("missingFields"))
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setErrorMessage(t("invalidCredentials"))
        setIsLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred"
      setErrorMessage(msg)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-muted/30 relative">
      {/* Language Switcher in Top Right */}
      <div className="absolute top-4 right-4">
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
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center space-y-2">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-950/25 border border-emerald-500/25 bg-slate-950">
            <Image
              src="/fot-logo.jpg"
              alt="Faculty of Technology Logo"
              fill
              sizes="80px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("brandTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("brandSubtitle")}
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{t("signInTitle")}</CardTitle>
            <CardDescription>{t("signInDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    className="pl-9"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("passwordLabel")}</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pl-9 pr-9"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("signingIn")}
                  </>
                ) : (
                  t("signInBtn")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t("officersOnly")}
        </p>
      </div>
    </div>
  )
}

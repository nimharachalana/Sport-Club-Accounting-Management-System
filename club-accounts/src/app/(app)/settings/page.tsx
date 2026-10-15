import { getTranslations } from "next-intl/server"

export default async function SettingsPage() {
  const t = await getTranslations("Nav")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("settings")}</h1>
      <p className="text-sm text-muted-foreground">Club financial configurations, opening balances, and currencies.</p>
    </div>
  )
}

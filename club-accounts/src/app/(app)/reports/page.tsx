import { getTranslations } from "next-intl/server"

export default async function ReportsPage() {
  const t = await getTranslations("Nav")
  const tDash = await getTranslations("Dashboard")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("reports")}</h1>
      <p className="text-sm text-muted-foreground">{tDash("manageReportsDesc")}</p>
    </div>
  )
}

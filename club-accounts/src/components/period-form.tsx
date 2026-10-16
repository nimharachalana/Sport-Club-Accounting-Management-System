import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export function PeriodForm({ from, to }: { from: string; to: string }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 print:hidden">
      <label className="grid gap-1 text-xs font-semibold text-foreground">
        From
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-foreground">
        To
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <Button
        type="submit"
        className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm font-semibold cursor-pointer gap-2 transition-all active:scale-[0.98]"
      >
        <Search className="h-4 w-4" />
        <span>Show Statement</span>
      </Button>
    </form>
  )
}

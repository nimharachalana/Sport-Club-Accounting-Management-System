export function PeriodForm({ from, to }: { from: string; to: string }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 print:hidden">
      <label className="grid gap-1 text-sm text-foreground">From
        <input type="date" name="from" defaultValue={from} className="rounded-md border border-input bg-background px-2 py-1 text-foreground" />
      </label>
      <label className="grid gap-1 text-sm text-foreground">To
        <input type="date" name="to" defaultValue={to} className="rounded-md border border-input bg-background px-2 py-1 text-foreground" />
      </label>
      <button type="submit" className="rounded-md border border-input bg-background hover:bg-muted px-3 py-1.5 text-sm font-medium text-foreground cursor-pointer transition-colors">Show</button>
    </form>
  )
}

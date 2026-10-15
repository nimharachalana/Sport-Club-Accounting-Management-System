'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-input bg-background hover:bg-muted px-3 py-1.5 text-sm text-foreground cursor-pointer transition-colors"
    >
      Print / Save as PDF
    </button>
  )
}

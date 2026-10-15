'use client'

import Papa from 'papaparse'

export function CsvButton({ rows, filename }: { rows: Record<string, unknown>[]; filename: string }) {
  return (
    <button
      type="button"
      className="rounded-md border border-input bg-background hover:bg-muted px-3 py-1.5 text-sm text-foreground cursor-pointer transition-colors"
      onClick={() => {
        const blob = new Blob(['\uFEFF' + Papa.unparse(rows)], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }}
    >
      CSV
    </button>
  )
}

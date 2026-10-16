'use client'

import Papa from 'papaparse'
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function CsvButton({ rows, filename }: { rows: Record<string, unknown>[]; filename: string }) {
  return (
    <Button
      type="button"
      className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/25 cursor-pointer gap-2 transition-all active:scale-[0.98]"
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
      <Download className="h-4 w-4 text-white" />
      <span>Export CSV</span>
    </Button>
  )
}

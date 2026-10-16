'use client'

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm font-semibold cursor-pointer gap-2 transition-all active:scale-[0.98]"
    >
      <Printer className="h-4 w-4" />
      <span>Print / Save as PDF</span>
    </Button>
  )
}

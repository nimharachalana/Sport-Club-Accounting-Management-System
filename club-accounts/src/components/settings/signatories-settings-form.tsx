"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { PenTool, Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SignatoriesSettingsProps {
  isAdmin: boolean
}

export function SignatoriesSettingsForm({ isAdmin }: SignatoriesSettingsProps) {
  const [seniorTreasurer, setSeniorTreasurer] = useState("")
  const [juniorTreasurer, setJuniorTreasurer] = useState("")
  const [dean, setDean] = useState("Prof. Subash Jayasinghe")
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem("report_senior_treasurer")
      const j = localStorage.getItem("report_junior_treasurer")
      const d = localStorage.getItem("report_dean")
      if (s) setSeniorTreasurer(s)
      if (j) setJuniorTreasurer(j)
      if (d) setDean(d)
    } catch {
      // ignore
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      toast.error("Only administrators can modify default signatories.")
      return
    }

    try {
      localStorage.setItem("report_senior_treasurer", seniorTreasurer.trim())
      localStorage.setItem("report_junior_treasurer", juniorTreasurer.trim())
      localStorage.setItem("report_dean", dean.trim() || "Prof. Subash Jayasinghe")
      setIsSaved(true)
      toast.success("Default report signatories saved successfully!")
      setTimeout(() => setIsSaved(false), 3000)
    } catch {
      toast.error("Failed to save signatories.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card border rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <PenTool className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Official Report Signatories</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Configure the default names that appear automatically in the Institutional Signatures block on the Income & Expenditure statement and printed financial documents.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Senior Treasurer */}
          <div className="space-y-2">
            <Label htmlFor="senior_treasurer" className="text-xs font-semibold">
              Senior Treasurer Name
            </Label>
            <Input
              id="senior_treasurer"
              value={seniorTreasurer}
              onChange={(e) => setSeniorTreasurer(e.target.value)}
              placeholder="e.g. Eng. J.L.R.M Kumara"
              disabled={!isAdmin}
              className="font-medium"
            />
            <p className="text-[11px] text-muted-foreground">Appears under &ldquo;Recommended by Senior Treasurer&rdquo;.</p>
          </div>

          {/* Junior Treasurer */}
          <div className="space-y-2">
            <Label htmlFor="junior_treasurer" className="text-xs font-semibold">
              Junior Treasurer Name
            </Label>
            <Input
              id="junior_treasurer"
              value={juniorTreasurer}
              onChange={(e) => setJuniorTreasurer(e.target.value)}
              placeholder="e.g. Mr. R.M.H.S Rajapaksha"
              disabled={!isAdmin}
              className="font-medium"
            />
            <p className="text-[11px] text-muted-foreground">Appears under &ldquo;Prepared by Junior Treasurer&rdquo;.</p>
          </div>

          {/* Dean */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dean" className="text-xs font-semibold">
              Dean / Approving Officer Name
            </Label>
            <Input
              id="dean"
              value={dean}
              onChange={(e) => setDean(e.target.value)}
              placeholder="Prof. Subash Jayasinghe"
              disabled={!isAdmin}
              className="max-w-md font-medium"
            />
            <p className="text-[11px] text-muted-foreground">Appears under &ldquo;Approved by Dean&rdquo;.</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved as Default</span>
            </span>
          )}
          <Button type="submit" className="gap-2 cursor-pointer font-bold px-6">
            <Save className="h-4 w-4" />
            <span>Save Signatories</span>
          </Button>
        </div>
      )}
    </form>
  )
}

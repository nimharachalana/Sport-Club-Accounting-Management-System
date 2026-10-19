"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"

interface ReportSignaturesProps {
  locale: string
}

export function ReportSignatures({ locale = "en" }: ReportSignaturesProps) {
  const { isAdmin } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Allow manual entry with localStorage persistence (Admin only)
  const [seniorTreasurer, setSeniorTreasurer] = useState("")
  const [juniorTreasurer, setJuniorTreasurer] = useState("")
  const [dean, setDean] = useState("Prof. Subash Jayasinghe")

  useEffect(() => {
    setMounted(true)
    try {
      const savedSenior = localStorage.getItem("report_senior_treasurer")
      const savedJunior = localStorage.getItem("report_junior_treasurer")
      const savedDean = localStorage.getItem("report_dean")
      if (savedSenior) setSeniorTreasurer(savedSenior)
      if (savedJunior) setJuniorTreasurer(savedJunior)
      if (savedDean) setDean(savedDean)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const canEdit = mounted && isAdmin

  const handleSeniorChange = (val: string) => {
    setSeniorTreasurer(val)
    try {
      localStorage.setItem("report_senior_treasurer", val)
    } catch {}
  }

  const handleJuniorChange = (val: string) => {
    setJuniorTreasurer(val)
    try {
      localStorage.setItem("report_junior_treasurer", val)
    } catch {}
  }

  const handleDeanChange = (val: string) => {
    setDean(val)
    try {
      localStorage.setItem("report_dean", val)
    } catch {}
  }

  return (
    <div className="mt-14 pt-8 border-t border-foreground/30 space-y-12 print:break-inside-avoid print:mt-10 print:pt-6">
      {/* Upper Row: Senior Treasurer (Left) & Dean (Right) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-14">
        {/* Recommended by Senior Treasurer */}
        <div className="space-y-3">
          <p className="font-bold text-sm text-foreground">
            Recommended by Senior Treasurer
          </p>

          <div className="space-y-1">
            {/* Screen Input / Print Text */}
            <div className="print:hidden">
              {canEdit ? (
                <input
                  type="text"
                  placeholder="Type Senior Treasurer name..."
                  value={seniorTreasurer}
                  onChange={(e) => handleSeniorChange(e.target.value)}
                  className="w-full max-w-xs text-sm border-b border-input focus:border-foreground bg-transparent py-1 text-foreground placeholder:text-muted-foreground/60 outline-hidden font-medium"
                />
              ) : (
                <div className="text-sm font-semibold text-foreground py-1">
                  {seniorTreasurer ? seniorTreasurer : "...................................................."}
                </div>
              )}
            </div>
            {/* Print Output */}
            <div className="hidden print:block text-sm font-semibold text-foreground">
              {seniorTreasurer ? seniorTreasurer : "...................................................."}
            </div>
          </div>

          <div className="pt-6 space-y-1.5">
            <div className="border-b border-dashed border-foreground/60 w-52 sm:w-60" />
            <p className="text-xs text-muted-foreground">Signature</p>
            <p className="text-xs text-muted-foreground pt-1">Date: ........................</p>
          </div>
        </div>

        {/* Approved by Dean */}
        <div className="space-y-3 sm:text-right sm:flex sm:flex-col sm:items-end">
          <p className="font-bold text-sm text-foreground">
            Approved by Dean
          </p>

          <div className="space-y-1 sm:w-full sm:flex sm:flex-col sm:items-end">
            {/* Screen Input / Print Text */}
            <div className="print:hidden w-full sm:flex sm:justify-end">
              {canEdit ? (
                <input
                  type="text"
                  placeholder="Type Dean name..."
                  value={dean}
                  onChange={(e) => handleDeanChange(e.target.value)}
                  className="w-full max-w-xs text-sm border-b border-input focus:border-foreground bg-transparent py-1 text-foreground placeholder:text-muted-foreground/60 outline-hidden font-medium sm:text-right"
                />
              ) : (
                <div className="text-sm font-semibold text-foreground py-1 sm:text-right">
                  {dean ? dean : "Prof. Subash Jayasinghe"}
                </div>
              )}
            </div>
            {/* Print Output */}
            <div className="hidden print:block text-sm font-semibold text-foreground">
              {dean ? dean : "Prof. Subash Jayasinghe"}
            </div>
          </div>

          <div className="pt-6 space-y-1.5 sm:flex sm:flex-col sm:items-end">
            <div className="border-b border-dashed border-foreground/60 w-52 sm:w-60" />
            <p className="text-xs text-muted-foreground">Signature</p>
            <p className="text-xs text-muted-foreground pt-1">Date: ........................</p>
          </div>
        </div>
      </div>

      {/* Lower Row: Prepared by Junior Treasurer */}
      <div className="max-w-md space-y-3">
        <p className="font-bold text-sm text-foreground">
          Prepared by Junior Treasurer
        </p>

        <div className="space-y-1">
          {/* Screen Input / Print Text */}
          <div className="print:hidden">
            {canEdit ? (
              <input
                type="text"
                placeholder="Type Junior Treasurer name..."
                value={juniorTreasurer}
                onChange={(e) => handleJuniorChange(e.target.value)}
                className="w-full max-w-xs text-sm border-b border-input focus:border-foreground bg-transparent py-1 text-foreground placeholder:text-muted-foreground/60 outline-hidden font-medium"
              />
            ) : (
              <div className="text-sm font-semibold text-foreground py-1">
                {juniorTreasurer ? juniorTreasurer : "...................................................."}
              </div>
            )}
          </div>
          {/* Print Output */}
          <div className="hidden print:block text-sm font-semibold text-foreground">
            {juniorTreasurer ? juniorTreasurer : "...................................................."}
          </div>
        </div>

        <div className="pt-6 space-y-1.5">
          <div className="border-b border-dashed border-foreground/60 w-52 sm:w-60" />
          <p className="text-xs text-muted-foreground">Signature</p>
          <p className="text-xs text-muted-foreground pt-1">Date: ........................</p>
        </div>
      </div>
    </div>
  )
}

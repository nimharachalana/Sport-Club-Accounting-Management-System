"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Users,
  ShieldCheck,
  Eye,
  UserPlus,
  Search,
  Trash2,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddViewerDialog } from "./add-viewer-dialog"
import { RemoveViewerDialog } from "./remove-viewer-dialog"
import type { ClubPerson } from "./types"

interface PeopleClientProps {
  people: ClubPerson[]
  isAdmin: boolean
  currentUserId: string
}

export function PeopleClient({
  people,
  isAdmin,
  currentUserId,
}: PeopleClientProps) {
  const router = useRouter()
  const t = useTranslations("People")

  const [searchQuery, setSearchQuery] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [personToRemove, setPersonToRemove] = useState<ClubPerson | null>(null)

  // Filter people by name or email
  const filteredPeople = people.filter((p) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const nameMatch = p.fullName.toLowerCase().includes(q)
    const emailMatch = p.email.toLowerCase().includes(q)
    return nameMatch || emailMatch
  })

  // Counters
  const totalCount = people.length
  const adminCount = people.filter((p) => p.role === "admin").length
  const viewerCount = people.filter((p) => p.role === "viewer").length

  const getInitials = (name: string, email: string) => {
    const target = name.trim() || email.split("@")[0]
    const parts = target.split(" ").filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return target.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subTitle")}
          </p>
        </div>

        {isAdmin ? (
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="self-start sm:self-auto gap-2 shadow-sm font-medium"
          >
            <UserPlus className="h-4 w-4" />
            {t("addViewer")}
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md border self-start sm:self-auto">
            <Lock className="h-3.5 w-3.5" />
            <span>{t("adminsOnlyNotice")}</span>
          </div>
        )}
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Accounts */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("totalAccounts")}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {totalCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Admin Accountants */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("adminAccounts")}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {adminCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Viewer Accounts */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("viewerAccounts")}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                {viewerCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Mobile Card Stream (Phones) */}
      <div className="md:hidden space-y-3">
        {filteredPeople.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">{t("noPeopleFound")}</p>
          </div>
        ) : (
          filteredPeople.map((person) => {
            const isCurrent = person.id === currentUserId
            const isPersonAdmin = person.role === "admin"
            const initials = getInitials(person.fullName, person.email)

            return (
              <div
                key={person.id}
                className="rounded-xl border bg-card p-4 space-y-3 shadow-xs hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none ${
                        isPersonAdmin
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20"
                          : "bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {person.fullName || person.email.split("@")[0]}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                            {t("currentAccount")}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground truncate mt-0.5">
                        {person.email}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    {isPersonAdmin ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        <Eye className="h-3 w-3" />
                        <span>Viewer</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <span>Joined {formatDate(person.createdAt)}</span>
                  <div>
                    {isCurrent ? (
                      <span className="italic text-muted-foreground">—</span>
                    ) : isPersonAdmin ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted">
                        {t("protected")}
                      </span>
                    ) : isAdmin ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPersonToRemove(person)}
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        <span>{t("remove")}</span>
                      </Button>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop & Tablet Table */}
      <div className="hidden md:block rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[300px]">{t("name")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>{t("noPeopleFound")}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeople.map((person) => {
                  const isCurrent = person.id === currentUserId
                  const isPersonAdmin = person.role === "admin"
                  const initials = getInitials(person.fullName, person.email)

                  return (
                    <TableRow key={person.id} className="hover:bg-muted/40">
                      {/* Name + Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none ${
                              isPersonAdmin
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20"
                                : "bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20"
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {person.fullName || person.email.split("@")[0]}
                            </p>
                            {isCurrent && (
                              <span className="inline-block text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                                {t("currentAccount")}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {person.email}
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {isPersonAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            <Eye className="h-3.5 w-3.5" />
                            <span>Viewer</span>
                          </span>
                        )}
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(person.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        {isCurrent ? (
                          <span className="text-xs text-muted-foreground italic px-2">
                            —
                          </span>
                        ) : isPersonAdmin ? (
                          <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 rounded bg-muted">
                            {t("protected")}
                          </span>
                        ) : isAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPersonToRemove(person)}
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            <span>{t("remove")}</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Viewer Modal Dialog */}
      <AddViewerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => router.refresh()}
      />

      {/* Remove Viewer Modal Dialog */}
      <RemoveViewerDialog
        person={personToRemove}
        open={!!personToRemove}
        onOpenChange={(open) => !open && setPersonToRemove(null)}
        onSuccess={() => {
          setPersonToRemove(null)
          router.refresh()
        }}
      />
    </div>
  )
}

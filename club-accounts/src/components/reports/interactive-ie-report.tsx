"use client"

import { useState, useEffect, useMemo, Fragment } from "react"
import { fmt } from "@/lib/money"
import { useAuth } from "@/components/auth-provider"
import { ReportSignatures } from "./report-signatures"
import { Plus, Pencil, RotateCcw, Check, X, ArrowRightLeft, Trash2 } from "lucide-react"

export interface ReportItem {
  id: string
  type: "income" | "expense"
  tx_date: string
  amount: number
  party: string | null
  note: string | null
  method: string
  category: { id: string; name_en: string; name_si: string } | null
  // User customized fields
  customHeading?: string
  customCategoryName?: string
  customNote?: string
  isManual?: boolean
}

interface InteractiveIEReportProps {
  initialTransactions: ReportItem[]
  currency: string
  from: string
  to: string
  locale: string
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const [y, m, d] = dateStr.split("-")
  return y && m && d ? `${d}/${m}/${y}` : dateStr
}

function getDefaultHeading(tx: ReportItem): string {
  const p = tx.party?.trim()
  const dateFormatted = formatDate(tx.tx_date)

  if (!p) return dateFormatted

  // If party contains event indicators, parentheses, or date markers, use party as heading
  const isEvent =
    /meet|faculty|batch|festival|show|night|tournament|championship|ceremony|\(|\//i.test(p) ||
    p.length > 25

  return isEvent ? p : dateFormatted
}

function renderNoteBullets(note: string | null) {
  if (!note || !note.trim()) return null
  const lines = note
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <div className="space-y-1 text-xs text-neutral-800 dark:text-neutral-200">
      {lines.map((line, idx) => {
        const clean = line.replace(/^[•\-\*]\s*/, "")
        return (
          <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
            <span className="text-neutral-600 dark:text-neutral-400 font-bold select-none">•</span>
            <span>{clean}</span>
          </div>
        )
      })}
    </div>
  )
}

export function InteractiveIEReport({
  initialTransactions,
  currency,
  from,
  to,
  locale,
}: InteractiveIEReportProps) {
  const { isAdmin } = useAuth()
  const [mounted, setMounted] = useState(false)
  const storageKey = `ie_report_custom_${from}_${to}`

  useEffect(() => {
    setMounted(true)
  }, [])

  const canEdit = mounted && isAdmin

  // State: items with possible custom headings/notes
  const [items, setItems] = useState<ReportItem[]>(() => {
    return initialTransactions.map((tx) => ({
      ...tx,
      customHeading: getDefaultHeading(tx),
    }))
  })

  // List of all active extra headings (appended at the bottom above final total row)
  const [extraHeadings, setExtraHeadings] = useState<{ income: string[]; expense: string[] }>({
    income: [],
    expense: [],
  })

  // UI state for adding new yellow section heading (positioned at the bottom above final total row)
  const [addingHeadingFor, setAddingHeadingFor] = useState<"income" | "expense" | null>(null)
  const [newHeadingText, setNewHeadingText] = useState("")

  // UI state for inline editing of an existing heading
  const [editingHeading, setEditingHeading] = useState<{
    type: "income" | "expense"
    oldHeading: string
  } | null>(null)
  const [headingInputText, setHeadingInputText] = useState("")

  // UI state for adding a manual item inside a specific section
  const [addingItemForSection, setAddingItemForSection] = useState<string | null>(null)
  const [itemDesc, setItemDesc] = useState("")
  const [itemNote, setItemNote] = useState("")
  const [itemAmount, setItemAmount] = useState("")

  // Load customizations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.items) {
          const overridesMap = parsed.items as Record<string, Partial<ReportItem>>
          // Load overrides for initial items
          const updated = initialTransactions.map((tx) => {
            const override = overridesMap[tx.id]
            return override ? { ...tx, ...override } : { ...tx, customHeading: getDefaultHeading(tx) }
          })
          // Also load any manually added items
          const manualItems = Object.entries(overridesMap)
            .filter(([id]) => id.startsWith("manual_"))
            .map(([id, val]) => ({
              id,
              type: val.type || "income",
              tx_date: val.tx_date || from,
              amount: Number(val.amount) || 0,
              party: val.party || null,
              note: val.note || null,
              method: "cash",
              category: null,
              customHeading: val.customHeading,
              customCategoryName: val.customCategoryName,
              customNote: val.customNote,
              isManual: true,
            })) as ReportItem[]

          setItems([...updated, ...manualItems])
        }
        if (parsed.extraHeadings) {
          setExtraHeadings(parsed.extraHeadings)
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey, initialTransactions, from])

  // Save to localStorage when modified
  const saveOverrides = (updatedItems: ReportItem[], updatedExtra: { income: string[]; expense: string[] }) => {
    try {
      const overrides: Record<string, Partial<ReportItem>> = {}
      for (const it of updatedItems) {
        if (it.isManual || it.customHeading || it.customCategoryName || it.customNote) {
          overrides[it.id] = {
            id: it.id,
            type: it.type,
            tx_date: it.tx_date,
            amount: it.amount,
            party: it.party,
            note: it.note,
            customHeading: it.customHeading,
            customCategoryName: it.customCategoryName,
            customNote: it.customNote,
            isManual: it.isManual,
          }
        }
      }
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          items: overrides,
          extraHeadings: updatedExtra,
        })
      )
    } catch {
      // ignore
    }
  }

  const handleReset = () => {
    if (confirm("Reset all manual headings and changes back to database defaults?")) {
      localStorage.removeItem(storageKey)
      setItems(
        initialTransactions.map((tx) => ({
          ...tx,
          customHeading: getDefaultHeading(tx),
          customCategoryName: undefined,
          customNote: undefined,
        }))
      )
      setExtraHeadings({ income: [], expense: [] })
      setAddingHeadingFor(null)
      setAddingItemForSection(null)
    }
  }

  // Add new section (appended at bottom of table, right above final total row)
  const handleAddNewHeading = (type: "income" | "expense") => {
    const trimmed = newHeadingText.trim()
    if (!trimmed) return
    const updatedExtra = {
      ...extraHeadings,
      [type]: Array.from(new Set([...extraHeadings[type], trimmed])),
    }
    setExtraHeadings(updatedExtra)
    setAddingHeadingFor(null)
    setNewHeadingText("")
    saveOverrides(items, updatedExtra)
  }

  // Delete an extra empty section
  const handleDeleteSection = (type: "income" | "expense", headingToDelete: string) => {
    const updatedExtra = {
      ...extraHeadings,
      [type]: extraHeadings[type].filter((h) => h !== headingToDelete),
    }
    setExtraHeadings(updatedExtra)
    saveOverrides(items, updatedExtra)
  }

  // Rename existing heading
  const handleRenameHeading = () => {
    if (!editingHeading || !headingInputText.trim()) return
    const { type, oldHeading } = editingHeading
    const newTitle = headingInputText.trim()

    const updatedItems = items.map((it) => {
      if (it.type === type && (it.customHeading || getDefaultHeading(it)) === oldHeading) {
        return { ...it, customHeading: newTitle }
      }
      return it
    })

    const updatedExtra = {
      ...extraHeadings,
      [type]: extraHeadings[type].map((h) => (h === oldHeading ? newTitle : h)),
    }

    setItems(updatedItems)
    setExtraHeadings(updatedExtra)
    setEditingHeading(null)
    saveOverrides(updatedItems, updatedExtra)
  }

  // Change heading for an individual transaction
  const handleItemHeadingChange = (itemId: string, newHeading: string) => {
    const updated = items.map((it) => (it.id === itemId ? { ...it, customHeading: newHeading } : it))
    setItems(updated)
    saveOverrides(updated, extraHeadings)
  }

  // Add a manual item directly into a section
  const handleSaveManualItem = (type: "income" | "expense", heading: string) => {
    if (!itemDesc.trim()) return
    const newItem: ReportItem = {
      id: `manual_${Date.now()}`,
      type,
      tx_date: from,
      amount: Number(itemAmount) || 0,
      party: heading,
      note: itemNote.trim() || null,
      method: "cash",
      category: null,
      customHeading: heading,
      customCategoryName: itemDesc.trim(),
      customNote: itemNote.trim() || undefined,
      isManual: true,
    }

    const updated = [...items, newItem]
    setItems(updated)
    setAddingItemForSection(null)
    setItemDesc("")
    setItemNote("")
    setItemAmount("")
    saveOverrides(updated, extraHeadings)
  }

  // Remove a manual item
  const handleDeleteItem = (itemId: string) => {
    const updated = items.filter((it) => it.id !== itemId)
    setItems(updated)
    saveOverrides(updated, extraHeadings)
  }

  // Helper to group transactions into sections
  // CRITICAL: Items from existing transactions are processed first, and extra added headings
  // are appended at the BOTTOM (directly above the final total row), NOT at the top!
  const groupItems = (type: "income" | "expense") => {
    const list = items.filter((it) => it.type === type)
    const map = new Map<string, { heading: string; items: ReportItem[]; subtotal: number }>()

    // 1. First add headings from existing transactions (preserving natural order)
    for (const tx of list) {
      const heading = tx.customHeading || getDefaultHeading(tx)
      if (!map.has(heading)) {
        map.set(heading, { heading, items: [], subtotal: 0 })
      }
      const g = map.get(heading)!
      g.items.push(tx)
      g.subtotal += Number(tx.amount || 0)
    }

    // 2. Then append newly added extra headings at the bottom (right above final total row!)
    for (const h of extraHeadings[type]) {
      if (!map.has(h)) {
        map.set(h, { heading: h, items: [], subtotal: 0 })
      }
    }

    return Array.from(map.values())
  }

  const incomeSections = useMemo(() => groupItems("income"), [items, extraHeadings])
  const expenseSections = useMemo(() => groupItems("expense"), [items, extraHeadings])

  const totalIncome = useMemo(
    () => items.filter((it) => it.type === "income").reduce((acc, it) => acc + Number(it.amount || 0), 0),
    [items]
  )
  const totalExpense = useMemo(
    () => items.filter((it) => it.type === "expense").reduce((acc, it) => acc + Number(it.amount || 0), 0),
    [items]
  )
  const net = totalIncome - totalExpense

  const money = (val: number) => fmt(val, currency)

  const getCatName = (tx: ReportItem) => {
    if (tx.customCategoryName) return tx.customCategoryName
    if (!tx.category) return "General"
    return locale === "si" && tx.category.name_si ? tx.category.name_si : tx.category.name_en
  }

  // All available headings for a given type
  const getAvailableHeadings = (type: "income" | "expense") => {
    const sections = type === "income" ? incomeSections : expenseSections
    return Array.from(new Set(sections.map((s) => s.heading)))
  }

  const renderTable = (
    type: "income" | "expense",
    sections: ReturnType<typeof groupItems>,
    totalAmount: number,
    totalLabel: string,
    totalBg: string
  ) => {
    const isIncome = type === "income"
    const availableHeadings = getAvailableHeadings(type)

    return (
      <section className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full border-2 border-neutral-900 dark:border-neutral-700 text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800 border-b-2 border-neutral-900 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold text-xs uppercase">
                <th className="py-2.5 px-3 text-left w-52 border-r border-neutral-800">Description</th>
                <th className="py-2.5 px-3 text-left border-r border-neutral-800">Details / Breakdown</th>
                <th className="py-2.5 px-3 text-right w-40">{isIncome ? "Income ( Rs )" : "Expenditure ( Rs )"}</th>
              </tr>
            </thead>
            <tbody>
              {sections.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-xs text-neutral-500 italic">
                    {isIncome ? "No income recorded in this period." : "No expenditure recorded in this period."}
                  </td>
                </tr>
              ) : (
                sections.map((section, sIdx) => {
                  const isEditingThis =
                    editingHeading?.type === type && editingHeading.oldHeading === section.heading
                  const isAddingToThisSection = addingItemForSection === `${type}_${section.heading}`
                  const isExtraEmptySection = extraHeadings[type].includes(section.heading) && section.items.length === 0

                  return (
                    <Fragment key={sIdx}>
                      {/* Yellow Section Heading Bar */}
                      <tr className="bg-[#fef08a] dark:bg-yellow-300 text-neutral-950 font-bold text-center border-y-2 border-neutral-900 print:bg-[#fef08a]!">
                        <td colSpan={3} className="py-2 px-3 text-center text-xs sm:text-sm font-extrabold tracking-wide">
                          {isEditingThis ? (
                            <div className="flex items-center justify-center gap-2 print:hidden py-0.5">
                              <input
                                type="text"
                                value={headingInputText}
                                onChange={(e) => setHeadingInputText(e.target.value)}
                                className="px-2 py-0.5 text-xs sm:text-sm font-extrabold rounded bg-white text-neutral-900 border border-neutral-800 outline-none w-72 text-center"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameHeading()
                                  if (e.key === "Escape") setEditingHeading(null)
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleRenameHeading}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                title="Save Heading"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingHeading(null)}
                                className="p-1 rounded bg-neutral-600 text-white hover:bg-neutral-700 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="group relative inline-flex items-center justify-center gap-2">
                              <span>{section.heading}</span>
                              {canEdit && (
                                <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 print:hidden transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingHeading({ type, oldHeading: section.heading })
                                      setHeadingInputText(section.heading)
                                    }}
                                    className="p-0.5 text-neutral-700 hover:text-black cursor-pointer"
                                    title="Rename yellow heading"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  {isExtraEmptySection && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSection(type, section.heading)}
                                      className="p-0.5 text-red-600 hover:text-red-800 cursor-pointer"
                                      title="Delete empty section"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Section Transactions */}
                      {section.items.map((tx) => {
                        const p = tx.party?.trim()
                        const isDistinctParty = p && p !== section.heading

                        return (
                          <tr
                            key={tx.id}
                            className="border-b border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 group"
                          >
                            <td className="py-2.5 px-3 align-top font-semibold text-neutral-900 dark:text-neutral-100 border-r border-neutral-800">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div>{getCatName(tx)}</div>
                                  {isDistinctParty && (
                                    <div className="text-[11px] font-normal text-neutral-500 mt-0.5">{p}</div>
                                  )}
                                </div>
                                {canEdit && tx.isManual && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(tx.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-0.5 print:hidden cursor-pointer"
                                    title="Remove this manual row"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              {/* Move to other section selector (Print hidden, Admin only) */}
                              {canEdit && availableHeadings.length > 1 && (
                                <div className="mt-1 pt-1 border-t border-neutral-200 dark:border-neutral-800 print:hidden flex items-center gap-1 text-[10px] text-neutral-500">
                                  <ArrowRightLeft className="h-2.5 w-2.5 shrink-0" />
                                  <span>Move:</span>
                                  <select
                                    value={section.heading}
                                    onChange={(e) => handleItemHeadingChange(tx.id, e.target.value)}
                                    className="rounded bg-transparent text-[10px] text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 py-0.5 px-1 outline-none"
                                  >
                                    {availableHeadings.map((h) => (
                                      <option key={h} value={h} className="bg-popover text-popover-foreground">
                                        {h}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 align-top border-r border-neutral-800">
                              {renderNoteBullets(tx.customNote ?? tx.note)}
                            </td>
                            <td className="py-2.5 px-3 align-top text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                              {money(Number(tx.amount))}
                            </td>
                          </tr>
                        )
                      })}

                      {/* Add Item Form inside this section (Print hidden, Admin only) */}
                      {canEdit && isAddingToThisSection && (
                        <tr className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-300 dark:border-amber-800 print:hidden">
                          <td className="p-2 border-r border-neutral-800">
                            <input
                              type="text"
                              value={itemDesc}
                              onChange={(e) => setItemDesc(e.target.value)}
                              placeholder="Description / Category"
                              className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none font-semibold"
                              autoFocus
                            />
                          </td>
                          <td className="p-2 border-r border-neutral-800">
                            <textarea
                              rows={2}
                              value={itemNote}
                              onChange={(e) => setItemNote(e.target.value)}
                              placeholder="Breakdown / Notes (one line per bullet)"
                              className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                            />
                          </td>
                          <td className="p-2 align-middle text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <input
                                type="number"
                                step="any"
                                value={itemAmount}
                                onChange={(e) => setItemAmount(e.target.value)}
                                placeholder="Amount (Rs)"
                                className="w-28 px-2 py-1 text-xs text-right font-bold rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveManualItem(type, section.heading)}
                                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAddingItemForSection(null)}
                                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-500 hover:bg-neutral-600 text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* "+ Add Item to this Section" Action Row (Print hidden, Admin only) */}
                      {canEdit && !isAddingToThisSection && (
                        <tr className="border-b border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 print:hidden">
                          <td colSpan={3} className="py-1 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setAddingItemForSection(`${type}_${section.heading}`)
                                setItemDesc("")
                                setItemNote("")
                                setItemAmount("")
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Add Row to this &ldquo;{section.heading}&rdquo; section</span>
                            </button>
                          </td>
                        </tr>
                      )}

                      {/* Cyan Section Subtotal Bar */}
                      <tr className="bg-[#7dd3fc] dark:bg-sky-300 text-neutral-950 font-bold border-b-2 border-neutral-900 print:bg-[#7dd3fc]!">
                        <td colSpan={2} className="py-2 px-4 text-center font-bold text-xs sm:text-sm">
                          Total
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-bold text-xs sm:text-sm">
                          {money(section.subtotal)}
                        </td>
                      </tr>
                    </Fragment>
                  )
                })
              )}

              {/* Add New Yellow Section Form: Positioned at the BOTTOM directly above the Final Total row (Admin only) */}
              {canEdit && addingHeadingFor === type && (
                <tr className="bg-amber-100 dark:bg-amber-950/40 border-y-2 border-amber-500 print:hidden">
                  <td colSpan={3} className="p-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        New Yellow Section Heading (e.g. Inter Batch Meet ( 21/02/2026 )):
                      </span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={newHeadingText}
                          onChange={(e) => setNewHeadingText(e.target.value)}
                          placeholder="e.g. Inter Batch Meet ( 21/02/2026 )"
                          className="flex-1 sm:w-80 px-2.5 py-1 text-xs rounded border border-amber-400 bg-white dark:bg-neutral-900 outline-none font-bold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddNewHeading(type)
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddNewHeading(type)}
                          className="px-3 py-1 rounded text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingHeadingFor(null)}
                          className="p-1 text-neutral-500 hover:text-neutral-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* "+ Add Yellow Section Heading" Button Row: Positioned AT THE BOTTOM, directly above the Final Total Row (Admin only) */}
              {canEdit && addingHeadingFor !== type && (
                <tr className="border-t border-neutral-300 dark:border-neutral-700 bg-amber-50/20 print:hidden">
                  <td colSpan={3} className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingHeadingFor(type)
                        setNewHeadingText("")
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-amber-400/20 text-amber-900 dark:text-amber-200 hover:bg-amber-400/35 border border-amber-400/50 cursor-pointer shadow-2xs transition-all"
                    >
                      <Plus className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                      <span>+ Add Yellow Section Heading (above Total)</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Final Grand Total Row */}
            <tfoot>
              <tr className={`${totalBg} text-neutral-950 font-extrabold border-t-2 border-neutral-900`}>
                <td colSpan={2} className="py-2.5 px-4 font-extrabold text-sm sm:text-base">
                  {totalLabel}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-extrabold text-sm sm:text-base">
                  {money(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-8">
      {/* Reset custom report modifications bar (Print hidden, Admin only) */}
      {canEdit && (
        <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/60 px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 text-xs print:hidden">
          <span className="text-neutral-600 dark:text-neutral-300 font-medium">
            💡 <strong>Tip:</strong> Click <strong>+ Add Yellow Section Heading</strong> at the bottom of the table (just above Total) to create another event section. Use <strong>+ Add Row</strong> inside any section to add items directly to the report!
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Reset headings and manual items back to database values"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
        </div>
      )}

      {/* Income Section */}
      {renderTable(
        "income",
        incomeSections,
        totalIncome,
        "Total Income",
        "bg-[#9ca3af] dark:bg-neutral-400 print:bg-[#9ca3af]!"
      )}

      {/* Expenditure Section */}
      {renderTable(
        "expense",
        expenseSections,
        totalExpense,
        "Total Expenditure",
        "bg-[#fde047] dark:bg-yellow-300 print:bg-[#fde047]!"
      )}

      {/* 4. Final Accounting Summary Block (Matching Page 6 of PDF) */}
      <section className="pt-2">
        <div className="w-full border-2 border-neutral-900 dark:border-neutral-700 divide-y-2 divide-neutral-900 dark:divide-neutral-700 text-sm sm:text-base font-extrabold">
          <div className="flex items-center justify-between bg-[#9ca3af] dark:bg-neutral-400 text-neutral-950 px-4 py-2.5 print:bg-[#9ca3af]!">
            <span>Total Income</span>
            <span className="tabular-nums text-base sm:text-lg">{money(totalIncome)}</span>
          </div>
          <div className="flex items-center justify-between bg-[#fde047] dark:bg-yellow-300 text-neutral-950 px-4 py-2.5 print:bg-[#fde047]!">
            <span>Total Expenditure</span>
            <span className="tabular-nums text-base sm:text-lg">{money(totalExpense)}</span>
          </div>
          <div className="flex items-center justify-between bg-[#4ade80] dark:bg-emerald-400 text-neutral-950 px-4 py-3 print:bg-[#4ade80]!">
            <span className="text-base sm:text-lg">
              {net >= 0 ? "Cash in Hand (Surplus)" : "Net Deficit"}
            </span>
            <span className="tabular-nums text-lg sm:text-xl font-black">{money(Math.abs(net))}</span>
          </div>
        </div>
      </section>

      {/* 5. Institutional Signatures Block */}
      <ReportSignatures locale={locale} />
    </div>
  )
}

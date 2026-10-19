"use client"

import { useState, useEffect, useMemo, Fragment } from "react"
import { fmt } from "@/lib/money"
import { useAuth } from "@/components/auth-provider"
import { ReportSignatures } from "./report-signatures"
import {
  Plus,
  Pencil,
  Check,
  X,
  Trash2,
  Split,
  Layers,
  CheckSquare,
  Square,
  Calculator,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react"

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
  customName?: string
  customDetail?: string
  customHeading?: string
  customCategoryName?: string
  customNote?: string
  isManual?: boolean
}

export interface VerticalMergeGroup {
  id: string
  type: "income" | "expense"
  itemIds: string[]
  title: string
}

export interface SectionConfig {
  id: string
  type: "income" | "expense"
  bannerTitle: string // e.g. "Inter Batch Meet ( 21/02/2026 )"
  itemIds: string[] // items included in this section
  showTotal: boolean // whether to render the bottom Cyan Total row
  totalLabel?: string // defaults to "Total"
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

function getItemName(tx: ReportItem): string {
  if (tx.customName?.trim()) return tx.customName.trim()
  if (tx.customCategoryName?.trim()) return tx.customCategoryName.trim()
  if (tx.category?.name_en?.trim()) return tx.category.name_en.trim()
  if (tx.party?.trim()) return tx.party.trim()
  if (tx.note?.trim()) return tx.note.trim()
  return "General"
}

function getItemDetail(tx: ReportItem): string {
  if (tx.customDetail !== undefined && tx.customDetail !== null && tx.customDetail.trim()) {
    return tx.customDetail.trim()
  }
  if (tx.customNote !== undefined && tx.customNote !== null && tx.customNote.trim()) {
    return tx.customNote.trim()
  }
  if (tx.note?.trim()) return tx.note.trim()
  const name = getItemName(tx)
  if (tx.party?.trim() && tx.party.trim() !== name) return tx.party.trim()
  return ""
}

function renderDetailBullets(detail: string | null) {
  if (!detail || !detail.trim()) return null
  const lines = detail
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <div className="space-y-1 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 text-left">
      {lines.map((line, idx) => {
        const clean = line.replace(/^[•\-\*]\s*/, "")
        return (
          <div key={idx} className="flex items-start gap-2 leading-relaxed">
            <span className="text-neutral-900 dark:text-neutral-100 font-black select-none text-sm leading-none">•</span>
            <span className="font-medium">{clean}</span>
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
  const storageKey = `ie_report_sections_v5_${from}_${to}`

  useEffect(() => {
    setMounted(true)
  }, [])

  const canEdit = mounted && isAdmin

  // Base items state
  const [items, setItems] = useState<ReportItem[]>(() => {
    return initialTransactions.map((tx) => ({ ...tx }))
  })

  // Sections (Yellow Banner at TOP, included items in middle, Cyan Total at BOTTOM)
  const [sections, setSections] = useState<SectionConfig[]>([])

  // Vertical merge groups (rowSpan = N on Column 1)
  const [verticalMerges, setVerticalMerges] = useState<VerticalMergeGroup[]>([])

  // Horizontal column merges (colSpan = 2)
  const [colSpanItemIds, setColSpanItemIds] = useState<string[]>([])

  // Checkbox Selection for Manual Merging or Section Creation
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  const [mergeTitleInput, setMergeTitleInput] = useState("")

  // Inline editing states
  const [editingMergeId, setEditingMergeId] = useState<string | null>(null)
  const [editingMergeTitle, setEditingMergeTitle] = useState("")

  const [editingBannerSectionId, setEditingBannerSectionId] = useState<string | null>(null)
  const [editingBannerText, setEditingBannerText] = useState("")

  const [editingDetailItemId, setEditingDetailItemId] = useState<string | null>(null)
  const [editingDetailText, setEditingDetailText] = useState("")

  // Add item inside a vertical merge group
  const [addingToMergeId, setAddingToMergeId] = useState<string | null>(null)
  const [newMergeDetail, setNewMergeDetail] = useState("")
  const [newMergeAmount, setNewMergeAmount] = useState("")

  // Add item inside a section
  const [addingToSectionId, setAddingToSectionId] = useState<string | null>(null)
  const [newSectionItemName, setNewSectionItemName] = useState("")
  const [newSectionItemDetail, setNewSectionItemDetail] = useState("")
  const [newSectionItemAmount, setNewSectionItemAmount] = useState("")
  const [newSectionItemColSpan, setNewSectionItemColSpan] = useState(false)

  // Add standalone item (outside any section)
  const [addingStandaloneType, setAddingStandaloneType] = useState<"income" | "expense" | null>(null)
  const [newStandaloneName, setNewStandaloneName] = useState("")
  const [newStandaloneDetail, setNewStandaloneDetail] = useState("")
  const [newStandaloneAmount, setNewStandaloneAmount] = useState("")
  const [newStandaloneColSpan, setNewStandaloneColSpan] = useState(false)

  // UI state for creating section dialog/prompt
  const [isCreatingSectionForType, setIsCreatingSectionForType] = useState<"income" | "expense" | null>(null)
  const [newSectionBannerTitle, setNewSectionBannerTitle] = useState("")

  // Row Move dropdown popup state
  const [openMoveMenuId, setOpenMoveMenuId] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = () => setOpenMoveMenuId(null)
    if (openMoveMenuId) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [openMoveMenuId])

  // Load customizations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.items) {
          const overridesMap = parsed.items as Record<string, Partial<ReportItem>>
          const updated = initialTransactions.map((tx) => {
            const override = overridesMap[tx.id]
            return override ? { ...tx, ...override } : tx
          })
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
              customName: val.customName,
              customDetail: val.customDetail,
              customCategoryName: val.customCategoryName,
              customNote: val.customNote,
              isManual: true,
            })) as ReportItem[]

          const allLoaded = [...updated, ...manualItems]
          if (Array.isArray(parsed.itemOrder)) {
            const orderMap = new Map(parsed.itemOrder.map((id: string, idx: number) => [id, idx]))
            allLoaded.sort((a, b) => {
              const orderA = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : 9999
              const orderB = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : 9999
              return orderA - orderB
            })
          }
          setItems(allLoaded)
        }
        if (Array.isArray(parsed.sections)) {
          setSections(parsed.sections)
        }
        if (Array.isArray(parsed.verticalMerges)) {
          setVerticalMerges(parsed.verticalMerges)
        }
        if (Array.isArray(parsed.colSpanItemIds)) {
          setColSpanItemIds(parsed.colSpanItemIds)
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey, initialTransactions, from])

  // Save customizations to localStorage
  const saveAll = (
    updatedItems: ReportItem[],
    updatedSections: SectionConfig[],
    updatedMerges: VerticalMergeGroup[],
    updatedColSpans: string[]
  ) => {
    try {
      const overrides: Record<string, Partial<ReportItem>> = {}
      for (const it of updatedItems) {
        if (it.isManual || it.customName || it.customDetail || it.customCategoryName || it.customNote) {
          overrides[it.id] = {
            id: it.id,
            type: it.type,
            tx_date: it.tx_date,
            amount: it.amount,
            party: it.party,
            note: it.note,
            customName: it.customName,
            customDetail: it.customDetail,
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
          itemOrder: updatedItems.map((it) => it.id),
          sections: updatedSections,
          verticalMerges: updatedMerges,
          colSpanItemIds: updatedColSpans,
        })
      )
    } catch {
      // ignore
    }
  }

  // Row selection toggle
  const handleToggleRowSelection = (itemId: string) => {
    const isSelected = selectedRowIds.includes(itemId)
    let next: string[]
    if (isSelected) {
      next = selectedRowIds.filter((id) => id !== itemId)
    } else {
      next = [...selectedRowIds, itemId]
    }
    setSelectedRowIds(next)

    if (next.length > 0 && !mergeTitleInput) {
      const firstItem = items.find((it) => it.id === next[0])
      if (firstItem) {
        setMergeTitleInput(getItemName(firstItem))
      }
    }
  }

  // Action 1: Merge Selected Rows vertically on Column 1 (rowSpan = N)
  const handleApplyVerticalMerge = (type: "income" | "expense") => {
    if (selectedRowIds.length < 2) return

    const typeItems = items.filter((it) => it.type === type)
    const orderedSelectedIds = typeItems
      .filter((it) => selectedRowIds.includes(it.id))
      .map((it) => it.id)

    if (orderedSelectedIds.length < 2) return

    const title = mergeTitleInput.trim() || getItemName(typeItems.find((it) => it.id === orderedSelectedIds[0])!)

    // Remove overlapping existing merges
    const cleanedMerges = verticalMerges.filter(
      (m) => !m.itemIds.some((id) => orderedSelectedIds.includes(id))
    )

    const newMerge: VerticalMergeGroup = {
      id: `vm_${Date.now()}`,
      type,
      itemIds: orderedSelectedIds,
      title,
    }

    const updatedMerges = [...cleanedMerges, newMerge]
    setVerticalMerges(updatedMerges)
    setSelectedRowIds([])
    setMergeTitleInput("")
    saveAll(items, sections, updatedMerges, colSpanItemIds)
  }

  // Action 2: Create a Section with Yellow Banner at Top & Auto-Calculated Cyan Total at Bottom
  const handleCreateSectionFromSelected = (type: "income" | "expense") => {
    if (selectedRowIds.length === 0) return
    const bannerTitle = newSectionBannerTitle.trim() || "Event / Project Section"

    const typeItems = items.filter((it) => it.type === type)
    const orderedSelectedIds = typeItems
      .filter((it) => selectedRowIds.includes(it.id))
      .map((it) => it.id)

    // Remove selected items from any existing sections to avoid duplicates
    const cleanedSections = sections.map((sec) => ({
      ...sec,
      itemIds: sec.itemIds.filter((id) => !orderedSelectedIds.includes(id)),
    })).filter((sec) => sec.itemIds.length > 0)

    const newSection: SectionConfig = {
      id: `sec_${Date.now()}`,
      type,
      bannerTitle,
      itemIds: orderedSelectedIds,
      showTotal: true,
      totalLabel: "Total",
    }

    const updatedSections = [...cleanedSections, newSection]
    setSections(updatedSections)
    setSelectedRowIds([])
    setIsCreatingSectionForType(null)
    setNewSectionBannerTitle("")
    saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
  }

  // Unmerge vertical merge group
  const handleUnmerge = (mergeId: string) => {
    const updatedMerges = verticalMerges.filter((m) => m.id !== mergeId)
    setVerticalMerges(updatedMerges)
    saveAll(items, sections, updatedMerges, colSpanItemIds)
  }

  // Rename vertical merge title
  const handleSaveMergeTitle = (mergeId: string) => {
    if (!editingMergeTitle.trim()) return
    const updatedMerges = verticalMerges.map((m) =>
      m.id === mergeId ? { ...m, title: editingMergeTitle.trim() } : m
    )
    setVerticalMerges(updatedMerges)
    setEditingMergeId(null)
    saveAll(items, sections, updatedMerges, colSpanItemIds)
  }

  // Rename Section Banner title
  const handleSaveBannerTitle = (sectionId: string) => {
    if (!editingBannerText.trim()) return
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, bannerTitle: editingBannerText.trim() } : s
    )
    setSections(updatedSections)
    setEditingBannerSectionId(null)
    saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
  }

  // Toggle Cyan Total Row on/off for a section
  const handleToggleSectionTotal = (sectionId: string) => {
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, showTotal: !s.showTotal } : s
    )
    setSections(updatedSections)
    saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
  }

  // Delete section (unwraps items back to standalone)
  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter((s) => s.id !== sectionId)
    setSections(updatedSections)
    saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
  }

  // Toggle horizontal 2-column merge (colSpan=2) for an individual row
  const handleToggleColSpan = (itemId: string) => {
    const updated = colSpanItemIds.includes(itemId)
      ? colSpanItemIds.filter((id) => id !== itemId)
      : [...colSpanItemIds, itemId]
    setColSpanItemIds(updated)
    saveAll(items, sections, verticalMerges, updated)
  }

  // Add bullet item inside a vertical merge group
  const handleSaveItemToMerge = (mergeGroup: VerticalMergeGroup) => {
    if (!newMergeDetail.trim()) return
    const newItemId = `manual_${Date.now()}`
    const newItem: ReportItem = {
      id: newItemId,
      type: mergeGroup.type,
      tx_date: from,
      amount: Number(newMergeAmount) || 0,
      party: mergeGroup.title,
      note: newMergeDetail.trim(),
      method: "cash",
      category: null,
      customName: mergeGroup.title,
      customDetail: newMergeDetail.trim(),
      isManual: true,
    }

    const lastItemId = mergeGroup.itemIds[mergeGroup.itemIds.length - 1]
    const lastIndex = items.findIndex((it) => it.id === lastItemId)

    const updatedItems = [...items]
    if (lastIndex !== -1) {
      updatedItems.splice(lastIndex + 1, 0, newItem)
    } else {
      updatedItems.push(newItem)
    }

    const updatedMerges = verticalMerges.map((m) =>
      m.id === mergeGroup.id ? { ...m, itemIds: [...m.itemIds, newItemId] } : m
    )

    // Also include in parent section if applicable
    const updatedSections = sections.map((sec) =>
      sec.itemIds.includes(lastItemId)
        ? { ...sec, itemIds: [...sec.itemIds, newItemId] }
        : sec
    )

    setItems(updatedItems)
    setVerticalMerges(updatedMerges)
    setSections(updatedSections)
    setAddingToMergeId(null)
    setNewMergeDetail("")
    setNewMergeAmount("")
    saveAll(updatedItems, updatedSections, updatedMerges, colSpanItemIds)
  }

  // Add a row directly inside a section
  const handleSaveItemToSection = (sectionId: string) => {
    if (!newSectionItemName.trim()) return
    const targetSection = sections.find((s) => s.id === sectionId)
    if (!targetSection) return

    const newItemId = `manual_${Date.now()}`
    const newItem: ReportItem = {
      id: newItemId,
      type: targetSection.type,
      tx_date: from,
      amount: Number(newSectionItemAmount) || 0,
      party: newSectionItemName.trim(),
      note: newSectionItemDetail.trim() || null,
      method: "cash",
      category: null,
      customName: newSectionItemName.trim(),
      customDetail: newSectionItemDetail.trim(),
      isManual: true,
    }

    const updatedItems = [...items, newItem]
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, itemIds: [...s.itemIds, newItemId] } : s
    )
    const updatedColSpans = newSectionItemColSpan
      ? [...colSpanItemIds, newItemId]
      : colSpanItemIds

    setItems(updatedItems)
    setSections(updatedSections)
    setColSpanItemIds(updatedColSpans)
    setAddingToSectionId(null)
    setNewSectionItemName("")
    setNewSectionItemDetail("")
    setNewSectionItemAmount("")
    setNewSectionItemColSpan(false)
    saveAll(updatedItems, updatedSections, verticalMerges, updatedColSpans)
  }

  // Add a standalone row (outside any section)
  const handleSaveStandalone = (type: "income" | "expense") => {
    if (!newStandaloneName.trim()) return
    const newItemId = `manual_${Date.now()}`
    const newItem: ReportItem = {
      id: newItemId,
      type,
      tx_date: from,
      amount: Number(newStandaloneAmount) || 0,
      party: newStandaloneName.trim(),
      note: newStandaloneDetail.trim() || null,
      method: "cash",
      category: null,
      customName: newStandaloneName.trim(),
      customDetail: newStandaloneDetail.trim(),
      isManual: true,
    }

    const updatedItems = [...items, newItem]
    const updatedColSpans = newStandaloneColSpan
      ? [...colSpanItemIds, newItemId]
      : colSpanItemIds

    setItems(updatedItems)
    setColSpanItemIds(updatedColSpans)
    setAddingStandaloneType(null)
    setNewStandaloneName("")
    setNewStandaloneDetail("")
    setNewStandaloneAmount("")
    setNewStandaloneColSpan(false)
    saveAll(updatedItems, sections, verticalMerges, updatedColSpans)
  }

  // Save edited detail
  const handleSaveDetail = (itemId: string) => {
    const updatedItems = items.map((it) =>
      it.id === itemId ? { ...it, customDetail: editingDetailText.trim() } : it
    )
    setItems(updatedItems)
    setEditingDetailItemId(null)
    saveAll(updatedItems, sections, verticalMerges, colSpanItemIds)
  }

  // Delete manual item
  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter((it) => it.id !== itemId)
    const updatedColSpans = colSpanItemIds.filter((id) => id !== itemId)
    const updatedMerges = verticalMerges
      .map((m) => ({ ...m, itemIds: m.itemIds.filter((id) => id !== itemId) }))
      .filter((m) => m.itemIds.length > 1)
    const updatedSections = sections.map((s) => ({
      ...s,
      itemIds: s.itemIds.filter((id) => id !== itemId),
    }))

    setItems(updatedItems)
    setColSpanItemIds(updatedColSpans)
    setVerticalMerges(updatedMerges)
    setSections(updatedSections)
    saveAll(updatedItems, updatedSections, updatedMerges, updatedColSpans)
  }

  // Move row up, down, to top, or to bottom with cross-boundary support
  const handleMoveRow = (itemId: string, direction: "up" | "down" | "top" | "bottom") => {
    const itemIndex = items.findIndex((it) => it.id === itemId)
    if (itemIndex === -1) return

    const currentItem = items[itemIndex]
    let updatedSections = [...sections]
    const secIndex = sections.findIndex((s) => s.itemIds.includes(itemId))

    if (secIndex !== -1) {
      const sec = { ...sections[secIndex] }
      const ids = [...sec.itemIds]
      const idx = ids.indexOf(itemId)
      if (idx !== -1) {
        if (direction === "up") {
          if (idx > 0) {
            const temp = ids[idx]
            ids[idx] = ids[idx - 1]
            ids[idx - 1] = temp
            sec.itemIds = ids
            updatedSections[secIndex] = sec
            setSections(updatedSections)
            saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
            return
          } else {
            // Move OUT of section (above section banner)
            ids.splice(idx, 1)
            sec.itemIds = ids
            updatedSections[secIndex] = sec
            setSections(updatedSections)
            // Ensure placed right before section's first item in items
            const updatedItems = [...items]
            const [moved] = updatedItems.splice(itemIndex, 1)
            const targetIdx = ids[0] ? updatedItems.findIndex((it) => it.id === ids[0]) : itemIndex
            updatedItems.splice(Math.max(0, targetIdx), 0, moved)
            setItems(updatedItems)
            saveAll(updatedItems, updatedSections, verticalMerges, colSpanItemIds)
            return
          }
        } else if (direction === "down") {
          if (idx < ids.length - 1) {
            const temp = ids[idx]
            ids[idx] = ids[idx + 1]
            ids[idx + 1] = temp
            sec.itemIds = ids
            updatedSections[secIndex] = sec
            setSections(updatedSections)
            saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
            return
          } else {
            // Move OUT of section (below cyan total)
            ids.splice(idx, 1)
            sec.itemIds = ids
            updatedSections[secIndex] = sec
            setSections(updatedSections)
            const updatedItems = [...items]
            const [moved] = updatedItems.splice(itemIndex, 1)
            const lastId = ids[ids.length - 1]
            const targetIdx = lastId ? updatedItems.findIndex((it) => it.id === lastId) + 1 : itemIndex
            updatedItems.splice(targetIdx, 0, moved)
            setItems(updatedItems)
            saveAll(updatedItems, updatedSections, verticalMerges, colSpanItemIds)
            return
          }
        } else if (direction === "top") {
          ids.splice(idx, 1)
          ids.unshift(itemId)
          sec.itemIds = ids
          updatedSections[secIndex] = sec
          setSections(updatedSections)
          saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
          return
        } else if (direction === "bottom") {
          ids.splice(idx, 1)
          ids.push(itemId)
          sec.itemIds = ids
          updatedSections[secIndex] = sec
          setSections(updatedSections)
          saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
          return
        }
      }
    }

    // Standalone item:
    const sameTypeItems = items.filter((it) => it.type === currentItem.type)
    const pos = sameTypeItems.findIndex((it) => it.id === itemId)

    if (direction === "up" && pos > 0) {
      const prevItem = sameTypeItems[pos - 1]
      const prevSec = sections.find((s) => s.itemIds.includes(prevItem.id))
      const updatedItems = [...items]

      if (prevSec && prevSec.itemIds.length > 0) {
        // Jump completely above the section
        const firstItemId = prevSec.itemIds[0]
        const targetIdx = updatedItems.findIndex((it) => it.id === firstItemId)
        const [moved] = updatedItems.splice(itemIndex, 1)
        updatedItems.splice(Math.max(0, targetIdx), 0, moved)
      } else {
        const prevIdx = updatedItems.findIndex((it) => it.id === prevItem.id)
        const temp = updatedItems[itemIndex]
        updatedItems[itemIndex] = updatedItems[prevIdx]
        updatedItems[prevIdx] = temp
      }
      setItems(updatedItems)
      saveAll(updatedItems, updatedSections, verticalMerges, colSpanItemIds)
    } else if (direction === "down" && pos < sameTypeItems.length - 1) {
      const nextItem = sameTypeItems[pos + 1]
      const nextSec = sections.find((s) => s.itemIds.includes(nextItem.id))
      const updatedItems = [...items]

      if (nextSec && nextSec.itemIds.length > 0) {
        // Jump completely below the section
        const lastItemId = nextSec.itemIds[nextSec.itemIds.length - 1]
        const targetIdx = updatedItems.findIndex((it) => it.id === lastItemId) + 1
        const [moved] = updatedItems.splice(itemIndex, 1)
        updatedItems.splice(targetIdx, 0, moved)
      } else {
        const nextIdx = updatedItems.findIndex((it) => it.id === nextItem.id)
        const temp = updatedItems[itemIndex]
        updatedItems[itemIndex] = updatedItems[nextIdx]
        updatedItems[nextIdx] = temp
      }
      setItems(updatedItems)
      saveAll(updatedItems, updatedSections, verticalMerges, colSpanItemIds)
    } else if (direction === "top" && pos > 0) {
      const firstSame = sameTypeItems[0]
      const targetIdx = items.findIndex((it) => it.id === firstSame.id)
      const updatedItems = [...items]
      const [moved] = updatedItems.splice(itemIndex, 1)
      updatedItems.splice(targetIdx, 0, moved)
      setItems(updatedItems)
      saveAll(updatedItems, updatedSections, verticalMerges, colSpanItemIds)
    } else if (direction === "bottom" && pos < sameTypeItems.length - 1) {
      const lastSame = sameTypeItems[sameTypeItems.length - 1]
      const targetIdx = items.findIndex((it) => it.id === lastSame.id)
      const updatedItems = [...items]
      const [moved] = updatedItems.splice(itemIndex, 1)
      updatedItems.splice(targetIdx, 0, moved)
      setItems(updatedItems)
      saveAll(updatedItems, updatedSections, verticalMerges, colSpanItemIds)
    }
  }

  // Move section up or down past adjacent items
  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    const sec = sections.find((s) => s.id === sectionId)
    if (!sec || sec.itemIds.length === 0) return

    const firstItemId = sec.itemIds[0]
    const lastItemId = sec.itemIds[sec.itemIds.length - 1]
    const firstIdx = items.findIndex((it) => it.id === firstItemId)
    const lastIdx = items.findIndex((it) => it.id === lastItemId)
    if (firstIdx === -1 || lastIdx === -1) return

    const sameTypeItems = items.filter((it) => it.type === sec.type)
    const posInType = sameTypeItems.findIndex((it) => it.id === firstItemId)

    if (direction === "up" && posInType > 0) {
      const prevItem = sameTypeItems[posInType - 1]
      const prevSec = sections.find((s) => s.itemIds.includes(prevItem.id))
      const targetFirstIdx = prevSec && prevSec.itemIds.length > 0
        ? items.findIndex((it) => it.id === prevSec.itemIds[0])
        : items.findIndex((it) => it.id === prevItem.id)

      if (targetFirstIdx !== -1 && targetFirstIdx < firstIdx) {
        // Move section items above target
        const updated = [...items]
        const secItemsCount = lastIdx - firstIdx + 1
        const moved = updated.splice(firstIdx, secItemsCount)
        updated.splice(targetFirstIdx, 0, ...moved)
        setItems(updated)
        saveAll(updated, sections, verticalMerges, colSpanItemIds)
      }
    } else if (direction === "down") {
      const lastSameTypePos = sameTypeItems.findIndex((it) => it.id === lastItemId)
      if (lastSameTypePos !== -1 && lastSameTypePos < sameTypeItems.length - 1) {
        const nextItem = sameTypeItems[lastSameTypePos + 1]
        const nextSec = sections.find((s) => s.itemIds.includes(nextItem.id))
        const targetLastIdx = nextSec && nextSec.itemIds.length > 0
          ? items.findIndex((it) => it.id === nextSec.itemIds[nextSec.itemIds.length - 1])
          : items.findIndex((it) => it.id === nextItem.id)

        if (targetLastIdx !== -1 && targetLastIdx > lastIdx) {
          const updated = [...items]
          const secItemsCount = lastIdx - firstIdx + 1
          const moved = updated.splice(firstIdx, secItemsCount)
          const insertIdx = targetLastIdx - secItemsCount + 1
          updated.splice(insertIdx, 0, ...moved)
          setItems(updated)
          saveAll(updated, sections, verticalMerges, colSpanItemIds)
        }
      }
    }
  }

  // Move normal row directly into a chosen main section
  const handleMoveRowIntoSection = (itemId: string, targetSectionId: string) => {
    const targetSecIndex = sections.findIndex((s) => s.id === targetSectionId)
    if (targetSecIndex === -1) return

    // Clean itemId from any other sections to prevent duplicates
    const cleanedSections = sections.map((s) => ({
      ...s,
      itemIds: s.itemIds.filter((id) => id !== itemId),
    }))

    // Add itemId to target section itemIds
    const targetSec = { ...cleanedSections[targetSecIndex] }
    targetSec.itemIds = [...targetSec.itemIds, itemId]
    cleanedSections[targetSecIndex] = targetSec

    // Place itemId adjacent to other items of target section in global items
    const itemIndex = items.findIndex((it) => it.id === itemId)
    const updatedItems = [...items]
    if (itemIndex !== -1 && targetSec.itemIds.length > 1) {
      const prevSectionItemId = targetSec.itemIds[targetSec.itemIds.length - 2]
      const prevItemIdx = updatedItems.findIndex((it) => it.id === prevSectionItemId)
      if (prevItemIdx !== -1) {
        const [moved] = updatedItems.splice(itemIndex, 1)
        const targetInsertIdx = prevItemIdx < itemIndex ? prevItemIdx + 1 : prevItemIdx
        updatedItems.splice(targetInsertIdx, 0, moved)
      }
    }

    setSections(cleanedSections)
    setItems(updatedItems)
    saveAll(updatedItems, cleanedSections, verticalMerges, colSpanItemIds)
  }

  // Move row out of its section to make it a normal standalone row
  const handleMoveRowOutOfSection = (itemId: string) => {
    const updatedSections = sections.map((s) => ({
      ...s,
      itemIds: s.itemIds.filter((id) => id !== itemId),
    }))
    setSections(updatedSections)
    saveAll(items, updatedSections, verticalMerges, colSpanItemIds)
  }

  // Move controls component for rows: Up arrow, Down arrow, and Dropdown button to move into main section
  const renderMoveControls = (itemId: string) => {
    if (!canEdit) return null
    const isOpen = openMoveMenuId === itemId
    const currentItem = items.find((it) => it.id === itemId)
    if (!currentItem) return null

    // Get all main sections available for this item's type (income or expense)
    const availableSections = sections.filter((s) => s.type === currentItem.type)
    const currentSection = availableSections.find((s) => s.itemIds.includes(itemId))

    return (
      <div className="relative inline-flex items-center gap-0.5 print:hidden select-none shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleMoveRow(itemId, "up")
          }}
          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 hover:text-black dark:text-neutral-200 dark:hover:text-white cursor-pointer transition-colors"
          title="Move Row Up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleMoveRow(itemId, "down")
          }}
          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 hover:text-black dark:text-neutral-200 dark:hover:text-white cursor-pointer transition-colors"
          title="Move Row Down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {/* Dropdown Menu Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpenMoveMenuId(isOpen ? null : itemId)
          }}
          className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center gap-0.5"
          title="Move into main section"
        >
          <span>Move</span>
          <span className="text-[9px]">▾</span>
        </button>

        {/* Floating Dropdown Menu: ONLY Main Sections names */}
        {isOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-xl py-1 min-w-[200px] text-xs font-semibold text-neutral-800 dark:text-neutral-200 animate-in fade-in zoom-in-95"
          >
            <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              Move into Main Section
            </div>

            {availableSections.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-500 italic">
                No main sections created yet. Use &ldquo;+ Create Section&rdquo; above to make one.
              </div>
            ) : (
              <div className="py-0.5 max-h-56 overflow-y-auto">
                {availableSections.map((sec) => {
                  const isCurrent = currentSection?.id === sec.id
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        handleMoveRowIntoSection(itemId, sec.id)
                        setOpenMoveMenuId(null)
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 text-xs transition-colors ${
                        isCurrent
                          ? "bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold cursor-default"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-neutral-900 dark:text-neutral-100"
                      }`}
                      title={isCurrent ? "Already in this section" : `Move row into ${sec.bannerTitle}`}
                    >
                      <span className="truncate flex-1">
                        ↳ {sec.bannerTitle}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                          Current
                        </span>
                      )}
                    </button>
                  )
                })}

                {currentSection && (
                  <>
                    <div className="border-t border-neutral-200 dark:border-neutral-800 my-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        handleMoveRowOutOfSection(itemId)
                        setOpenMoveMenuId(null)
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center gap-1.5 cursor-pointer text-xs font-bold"
                      title="Move this row out of the section to make it a normal standalone row"
                    >
                      <span>↰</span>
                      <span>Move out of Section</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const incomeItems = useMemo(() => items.filter((it) => it.type === "income"), [items])
  const expenseItems = useMemo(() => items.filter((it) => it.type === "expense"), [items])

  const totalIncome = useMemo(
    () => incomeItems.reduce((acc, it) => acc + Number(it.amount || 0), 0),
    [incomeItems]
  )
  const totalExpense = useMemo(
    () => expenseItems.reduce((acc, it) => acc + Number(it.amount || 0), 0),
    [expenseItems]
  )
  const net = totalIncome - totalExpense

  const money = (val: number) => fmt(val, currency)

  // Render a specific table row (handles vertical merges, colSpan=2, and standard split)
  const renderRow = (item: ReportItem, typeMerges: VerticalMergeGroup[]) => {
    const isSelected = selectedRowIds.includes(item.id)
    const isColSpan2 = colSpanItemIds.includes(item.id)
    const itemName = getItemName(item)
    const detail = getItemDetail(item)
    const isEditingDetail = editingDetailItemId === item.id

    // Check if item belongs to a vertical merge group
    const mergeGroup = typeMerges.find((m) => m.itemIds.includes(item.id))
    const isFirstInMerge = mergeGroup ? mergeGroup.itemIds[0] === item.id : false
    const isFollowerInMerge = mergeGroup ? !isFirstInMerge : false
    const isEditingMergeTitleThis = mergeGroup && editingMergeId === mergeGroup.id

    if (isFollowerInMerge) {
      // Row is covered by rowSpan on row 0: render only Column 2 and Column 3
      return (
        <tr
          key={item.id}
          className={`border-b border-neutral-900 dark:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 group/row transition-colors ${
            isSelected ? "bg-blue-50/70 dark:bg-blue-950/25" : ""
          }`}
        >
          {canEdit && (
            <td className="py-2 px-2 text-center align-middle border-r border-neutral-900 dark:border-neutral-700 print:hidden select-none">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleRowSelection(item.id)}
                className="rounded text-blue-600 cursor-pointer h-3.5 w-3.5"
              />
            </td>
          )}
          {/* Column 2: Detail Bullet */}
          <td className="py-2.5 px-4 align-middle border-r border-neutral-900 dark:border-neutral-700 text-left">
            <div className="flex items-center justify-between">
              <div>{renderDetailBullets(detail)}</div>
              {canEdit && (
                <div className="opacity-0 group-hover/row:opacity-100 print:hidden transition-opacity flex items-center gap-1 ml-2">
                  {renderMoveControls(item.id)}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDetailItemId(item.id)
                      setEditingDetailText(detail)
                    }}
                    className="p-0.5 text-neutral-500 hover:text-black dark:text-neutral-400 cursor-pointer"
                    title="Edit detail"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {item.isManual && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-0.5 text-red-500 hover:text-red-700 cursor-pointer"
                      title="Delete row"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </td>
          {/* Column 3: Amount */}
          <td className="py-2.5 px-4 align-middle text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100 w-36 sm:w-44">
            {money(Number(item.amount))}
          </td>
        </tr>
      )
    }

    return (
      <Fragment key={item.id}>
        <tr
          className={`border-b border-neutral-900 dark:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 group/row transition-colors ${
            isSelected ? "bg-blue-50/70 dark:bg-blue-950/25" : ""
          }`}
        >
          {/* Checkbox (Admin only, print:hidden) */}
          {canEdit && (
            <td className="py-2 px-2 text-center align-middle border-r border-neutral-900 dark:border-neutral-700 print:hidden select-none">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleRowSelection(item.id)}
                className="rounded text-blue-600 cursor-pointer h-3.5 w-3.5"
              />
            </td>
          )}

          {/* CASE 1: Vertically Merged Column 1 (rowSpan = N) */}
          {mergeGroup ? (
            <>
              {isFirstInMerge && (
                <td
                  rowSpan={mergeGroup.itemIds.length}
                  className="py-3 px-3 sm:px-4 align-middle text-center font-bold text-neutral-950 dark:text-neutral-50 border-r border-neutral-900 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-900/30 w-52 sm:w-64 leading-snug tracking-tight"
                >
                  {isEditingMergeTitleThis ? (
                    <div className="flex flex-col items-center gap-1.5 print:hidden">
                      <input
                        type="text"
                        value={editingMergeTitle}
                        onChange={(e) => setEditingMergeTitle(e.target.value)}
                        className="px-2 py-1 text-xs font-bold rounded bg-white text-neutral-900 border border-neutral-800 outline-none w-44 text-center"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveMergeTitle(mergeGroup.id)
                          if (e.key === "Escape") setEditingMergeId(null)
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveMergeTitle(mergeGroup.id)}
                          className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMergeId(null)}
                          className="p-1 rounded bg-neutral-600 text-white cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 flex flex-col items-center justify-center">
                      <div className="font-bold text-xs sm:text-sm leading-snug whitespace-pre-line text-neutral-950 dark:text-neutral-100 text-center">
                        {mergeGroup.title}
                      </div>

                      {/* Admin Controls on Merged Cell */}
                      {canEdit && (
                        <div className="flex flex-wrap items-center justify-center gap-1 print:hidden pt-1.5 border-t border-neutral-300 dark:border-neutral-700 w-full opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMergeId(mergeGroup.id)
                              setEditingMergeTitle(mergeGroup.title)
                            }}
                            className="p-1 rounded text-neutral-600 hover:text-black dark:text-neutral-300 cursor-pointer"
                            title="Rename title"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnmerge(mergeGroup.id)}
                            className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-950 dark:text-amber-200 text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                            title="Split merged rows back to individual cells"
                          >
                            <Split className="h-3 w-3" />
                            <span>Unmerge ({mergeGroup.itemIds.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingToMergeId(mergeGroup.id)
                              setNewMergeDetail("")
                              setNewMergeAmount("")
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-950 dark:text-emerald-200 text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                            title="Add bullet under this title"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Row</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              )}

              {/* Column 2: Detail Bullet */}
              <td className="py-2.5 px-4 align-middle border-r border-neutral-900 dark:border-neutral-700 text-left">
                <div className="flex items-center justify-between">
                  <div>{renderDetailBullets(detail)}</div>
                  {canEdit && (
                    <div className="opacity-0 group-hover/row:opacity-100 print:hidden transition-opacity flex items-center gap-1 ml-2">
                      {renderMoveControls(item.id)}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDetailItemId(item.id)
                          setEditingDetailText(detail)
                        }}
                        className="p-0.5 text-neutral-500 hover:text-black dark:text-neutral-400 cursor-pointer"
                        title="Edit detail bullet"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      {item.isManual && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-0.5 text-red-500 hover:text-red-700 cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </td>

              {/* Column 3: Amount */}
              <td className="py-2.5 px-4 align-middle text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100 w-36 sm:w-44">
                {money(Number(item.amount))}
              </td>
            </>
          ) : isColSpan2 ? (
            /* CASE 2: Merged horizontally across Column 1 & 2 (colSpan=2) */
            <>
              <td
                colSpan={2}
                className="py-3 px-4 align-middle text-center font-bold text-neutral-950 dark:text-neutral-50 border-r border-neutral-900 dark:border-neutral-700 text-xs sm:text-sm leading-snug"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center font-bold text-xs sm:text-sm">
                    <span>{itemName}</span>
                    {detail && (
                      <div className="text-xs font-normal text-neutral-600 dark:text-neutral-400 mt-0.5">
                        {detail}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="opacity-0 group-hover/row:opacity-100 print:hidden transition-opacity flex items-center gap-1 ml-2">
                      {renderMoveControls(item.id)}
                      <button
                        type="button"
                        onClick={() => handleToggleColSpan(item.id)}
                        className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[10px] font-medium hover:bg-neutral-300 cursor-pointer"
                        title="Split back to 2 columns"
                      >
                        Split Cols
                      </button>
                      {item.isManual && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-4 align-middle text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100 w-36 sm:w-44">
                {money(Number(item.amount))}
              </td>
            </>
          ) : (
            /* CASE 3: Standard separate columns (Column 1 Description, Column 2 Details) */
            <>
              <td className="py-3 px-3 sm:px-4 align-middle text-center font-bold text-neutral-950 dark:text-neutral-50 border-r border-neutral-900 dark:border-neutral-700 w-52 sm:w-64 leading-snug tracking-tight">
                <div className="flex items-center justify-between">
                  <span className="flex-1 text-center font-bold text-xs sm:text-sm whitespace-pre-line">
                    {itemName}
                  </span>
                  {canEdit && (
                    <div className="opacity-0 group-hover/row:opacity-100 print:hidden transition-opacity flex items-center gap-1 ml-1">
                      {renderMoveControls(item.id)}
                      <button
                        type="button"
                        onClick={() => handleToggleColSpan(item.id)}
                        className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-medium hover:bg-neutral-200 border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                        title="Merge across Description and Details (colSpan=2)"
                      >
                        ⇄ Merge 2 Cols
                      </button>
                    </div>
                  )}
                </div>
              </td>

              <td className="py-2.5 px-4 align-middle border-r border-neutral-900 dark:border-neutral-700 text-left">
                {isEditingDetail ? (
                  <div className="flex items-center gap-2 print:hidden py-1">
                    <input
                      type="text"
                      value={editingDetailText}
                      onChange={(e) => setEditingDetailText(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveDetail(item.id)
                        if (e.key === "Escape") setEditingDetailItemId(null)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveDetail(item.id)}
                      className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDetailItemId(null)}
                      className="p-1 rounded bg-neutral-600 text-white cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>{renderDetailBullets(detail)}</div>
                    {canEdit && (
                      <div className="opacity-0 group-hover/row:opacity-100 print:hidden transition-opacity flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDetailItemId(item.id)
                            setEditingDetailText(detail)
                          }}
                          className="p-0.5 text-neutral-500 hover:text-black dark:text-neutral-400 cursor-pointer"
                          title="Edit detail bullet"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {item.isManual && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-0.5 text-red-500 hover:text-red-700 cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </td>

              <td className="py-2.5 px-4 align-middle text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100 w-36 sm:w-44">
                {money(Number(item.amount))}
              </td>
            </>
          )}
        </tr>

        {/* Inline form to add bullet item directly under this merge group */}
        {canEdit &&
          mergeGroup &&
          addingToMergeId === mergeGroup.id &&
          isFirstInMerge && (
            <tr className="bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-700 print:hidden">
              {canEdit && <td className="p-2 border-r border-neutral-900 dark:border-neutral-700"></td>}
              <td className="p-2 text-center text-xs font-bold text-amber-900 dark:text-amber-200 border-r border-neutral-900 dark:border-neutral-700">
                + Bullet under &ldquo;{mergeGroup.title}&rdquo;
              </td>
              <td className="p-2 border-r border-neutral-900 dark:border-neutral-700">
                <input
                  type="text"
                  value={newMergeDetail}
                  onChange={(e) => setNewMergeDetail(e.target.value)}
                  placeholder="Bullet text (e.g. Donation received for gift)"
                  className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                  autoFocus
                />
              </td>
              <td className="p-2 align-middle text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <input
                    type="number"
                    step="any"
                    value={newMergeAmount}
                    onChange={(e) => setNewMergeAmount(e.target.value)}
                    placeholder="Amount (Rs)"
                    className="w-24 sm:w-28 px-2 py-1 text-xs text-right font-bold rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveItemToMerge(mergeGroup)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveItemToMerge(mergeGroup)}
                    className="px-2 py-1 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingToMergeId(null)}
                    className="px-2 py-1 rounded text-xs font-bold bg-neutral-500 hover:bg-neutral-600 text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </td>
            </tr>
          )}
      </Fragment>
    )
  }

  const renderTable = (
    type: "income" | "expense",
    itemList: ReportItem[],
    totalAmount: number,
    totalLabel: string,
    totalBg: string
  ) => {
    const isIncome = type === "income"
    const typeMerges = verticalMerges.filter((m) => m.type === type)
    const typeSections = sections.filter((s) => s.type === type)
    const selectedInThisTable = selectedRowIds.filter((id) =>
      itemList.some((it) => it.id === id)
    )

    // Partition items into Sections and Standalone items
    const allSectionItemIds = new Set(typeSections.flatMap((s) => s.itemIds))
    const standaloneItems = itemList.filter((it) => !allSectionItemIds.has(it.id))

    return (
      <section className="space-y-3">
        {/* Mobile Swipe Hint */}
        <div className="sm:hidden flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 print:hidden select-none">
          <span>↔ Swipe table horizontally to view all columns</span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Scrollable</span>
        </div>

        {/* Admin Action Toolbar above Table (print hidden) */}
        {canEdit && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg border border-neutral-300 dark:border-neutral-700 print:hidden text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px]">
                {isIncome ? "Income Table" : "Expenditure Table"}
              </span>

              {/* Create Section Button (prompt) */}
              <button
                type="button"
                onClick={() => {
                  if (selectedInThisTable.length > 0) {
                    setIsCreatingSectionForType(type)
                    setNewSectionBannerTitle("")
                  } else {
                    alert("Please select rows using the checkboxes first to include them in this section.")
                  }
                }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded font-bold cursor-pointer shadow-2xs transition-colors ${
                  selectedInThisTable.length > 0
                    ? "bg-amber-400 hover:bg-amber-500 text-amber-950 animate-pulse"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300"
                }`}
                title="Create a section with Yellow Banner at TOP and Auto-Calculated Cyan Total at BOTTOM"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>+ Create Section ({selectedInThisTable.length} selected)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setAddingStandaloneType(type)
                  setNewStandaloneName("")
                  setNewStandaloneDetail("")
                  setNewStandaloneAmount("")
                  setNewStandaloneColSpan(false)
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-2xs transition-colors"
                title="Add standalone row (outside sections)"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Row</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal / Prompt to name the Section Banner */}
        {canEdit && isCreatingSectionForType === type && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 rounded-lg print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-950 dark:text-amber-200">
                Yellow Section Banner Title:
              </span>
            </div>

            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={newSectionBannerTitle}
                onChange={(e) => setNewSectionBannerTitle(e.target.value)}
                placeholder="e.g. Inter Batch Meet ( 21/02/2026 )"
                className="flex-1 px-3 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 font-bold outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSectionFromSelected(type)
                }}
              />
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleCreateSectionFromSelected(type)}
                  className="px-3.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                >
                  Create Section
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingSectionForType(null)}
                  className="px-2 py-1 text-neutral-600 hover:text-black font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Manual Merge Action Bar when Admin selects 2+ rows */}
        {canEdit && selectedInThisTable.length >= 2 && !isCreatingSectionForType && (
          <div className="fixed bottom-3 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 bg-neutral-950/95 backdrop-blur-md text-white p-3 sm:px-5 sm:py-3 rounded-xl shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-2 border-blue-500 animate-in fade-in slide-in-from-bottom-4 print:hidden max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full shrink-0">
                {selectedInThisTable.length} rows selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1">
              <input
                type="text"
                value={mergeTitleInput}
                onChange={(e) => setMergeTitleInput(e.target.value)}
                placeholder="Description title for Column 1"
                className="flex-1 min-w-[180px] px-3 py-1 text-xs rounded bg-neutral-900 text-white border border-neutral-700 outline-none font-bold placeholder:text-neutral-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyVerticalMerge(type)
                }}
              />
              <button
                type="button"
                onClick={() => handleApplyVerticalMerge(type)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer shadow-md transition-colors shrink-0"
                title="Merge Column 1 across the selected rows"
              >
                Merge Col 1
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSectionForType(type)
                  setNewSectionBannerTitle("")
                }}
                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold cursor-pointer shadow-md transition-colors shrink-0"
                title="Wrap selected rows in a Section Banner (Top) and Auto-Calculated Cyan Total (Bottom)"
              >
                + Section
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRowIds([])
                  setMergeTitleInput("")
                }}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer shrink-0"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Responsive Table Container */}
        <div className="overflow-x-auto -mx-1 sm:mx-0 shadow-2xs rounded-lg border border-neutral-900 dark:border-neutral-700 [print:overflow-visible] [print:border-none]">
          <table className="w-full min-w-[580px] sm:min-w-full border-2 border-neutral-900 dark:border-neutral-700 text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800 border-b-2 border-neutral-900 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
                {canEdit && (
                  <th className="py-2.5 px-2 text-center w-8 border-r border-neutral-900 dark:border-neutral-700 print:hidden select-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedInThisTable.length === itemList.length) {
                          setSelectedRowIds(selectedRowIds.filter((id) => !itemList.some((it) => it.id === id)))
                        } else {
                          setSelectedRowIds(Array.from(new Set([...selectedRowIds, ...itemList.map((it) => it.id)])))
                        }
                      }}
                      className="text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
                      title="Select / Deselect all rows"
                    >
                      {selectedInThisTable.length > 0 && selectedInThisTable.length === itemList.length ? (
                        <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-2.5 px-3 sm:px-4 text-center align-middle w-52 sm:w-64 border-r border-neutral-900 dark:border-neutral-700">
                  Description
                </th>
                <th className="py-2.5 px-4 text-center align-middle border-r border-neutral-900 dark:border-neutral-700">
                  Details
                </th>
                <th className="py-2.5 px-4 text-center align-middle w-36 sm:w-44">
                  {isIncome ? "Income ( Rs )" : "Expenditure ( Rs )"}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* If table is empty */}
              {itemList.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 4 : 3} className="py-6 text-center text-xs text-neutral-500 italic">
                    {isIncome ? "No income recorded in this period." : "No expenditure recorded in this period."}
                  </td>
                </tr>
              ) : (
                <>
                  {/* Unified render of sections and rows in user-configured sequence */}
                  {(() => {
                    const renderedSectionIds = new Set<string>()
                    const elements: React.ReactNode[] = []

                    itemList.forEach((item) => {
                      const sec = typeSections.find((s) => s.itemIds.includes(item.id))
                      if (sec) {
                        if (!renderedSectionIds.has(sec.id)) {
                          renderedSectionIds.add(sec.id)
                          const secItems = sec.itemIds
                            .map((id) => itemList.find((it) => it.id === id))
                            .filter(Boolean) as ReportItem[]
                          const sectionTotal = secItems.reduce((acc, it) => acc + Number(it.amount || 0), 0)
                          const isEditingBanner = editingBannerSectionId === sec.id

                          elements.push(
                            <Fragment key={sec.id}>
                              {/* A. YELLOW SECTION BANNER AT THE TOP OF INCLUDED DETAILS */}
                              <tr className="bg-[#fef08a] dark:bg-yellow-300 text-neutral-950 font-bold text-center border-y-2 border-neutral-900 print:bg-[#fef08a]!">
                                <td
                                  colSpan={canEdit ? 4 : 3}
                                  className="py-2.5 px-4 text-center text-xs sm:text-sm font-extrabold tracking-wide"
                                >
                                  {isEditingBanner ? (
                                    <div className="flex items-center justify-center gap-2 print:hidden py-0.5">
                                      <input
                                        type="text"
                                        value={editingBannerText}
                                        onChange={(e) => setEditingBannerText(e.target.value)}
                                        className="px-2.5 py-1 text-xs sm:text-sm font-extrabold rounded bg-white text-neutral-900 border border-neutral-800 outline-none w-72 sm:w-96 text-center"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleSaveBannerTitle(sec.id)
                                          if (e.key === "Escape") setEditingBannerSectionId(null)
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveBannerTitle(sec.id)}
                                        className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingBannerSectionId(null)}
                                        className="p-1 rounded bg-neutral-600 text-white cursor-pointer"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="group/sec relative inline-flex items-center justify-center gap-2">
                                      <span>{sec.bannerTitle}</span>
                                      {canEdit && (
                                        <div className="inline-flex items-center gap-1.5 opacity-0 group-hover/sec:opacity-100 print:hidden transition-opacity ml-2">
                                          <button
                                            type="button"
                                            onClick={() => handleMoveSection(sec.id, "up")}
                                            className="p-0.5 text-neutral-700 hover:text-black cursor-pointer"
                                            title="Move Section Up"
                                          >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleMoveSection(sec.id, "down")}
                                            className="p-0.5 text-neutral-700 hover:text-black cursor-pointer"
                                            title="Move Section Down"
                                          >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingBannerSectionId(sec.id)
                                              setEditingBannerText(sec.bannerTitle)
                                            }}
                                            className="p-0.5 text-neutral-700 hover:text-black cursor-pointer"
                                            title="Rename Section Banner"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleSectionTotal(sec.id)}
                                            className="p-0.5 text-neutral-700 hover:text-black cursor-pointer"
                                            title={sec.showTotal ? "Hide bottom Cyan Total row" : "Show bottom Cyan Total row"}
                                          >
                                            {sec.showTotal ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAddingToSectionId(sec.id)
                                              setNewSectionItemName("")
                                              setNewSectionItemDetail("")
                                              setNewSectionItemAmount("")
                                              setNewSectionItemColSpan(false)
                                            }}
                                            className="p-0.5 text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold inline-flex items-center gap-0.5"
                                            title="Add row to this section"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSection(sec.id)}
                                            className="p-0.5 text-red-600 hover:text-red-800 cursor-pointer"
                                            title="Remove section banner"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>

                              {/* B. INCLUDED ROWS IN THE MIDDLE */}
                              {secItems.map((sItem) => renderRow(sItem, typeMerges))}

                              {/* Inline form to add a row inside this section */}
                              {canEdit && addingToSectionId === sec.id && (
                                <tr className="bg-amber-100/60 dark:bg-amber-950/40 border-y-2 border-amber-500 print:hidden">
                                  {canEdit && <td className="p-2 border-r border-neutral-900 dark:border-neutral-700"></td>}
                                  <td className="p-2 border-r border-neutral-900 dark:border-neutral-700">
                                    <input
                                      type="text"
                                      value={newSectionItemName}
                                      onChange={(e) => setNewSectionItemName(e.target.value)}
                                      placeholder="Description (e.g. Volleyball)"
                                      className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none font-bold text-center"
                                      autoFocus
                                    />
                                  </td>
                                  <td className="p-2 border-r border-neutral-900 dark:border-neutral-700">
                                    <div className="space-y-1">
                                      <input
                                        type="text"
                                        value={newSectionItemDetail}
                                        onChange={(e) => setNewSectionItemDetail(e.target.value)}
                                        placeholder="Detail bullet (e.g. Total income in stall)"
                                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                                      />
                                      <label className="inline-flex items-center gap-1.5 text-[11px] text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={newSectionItemColSpan}
                                          onChange={(e) => setNewSectionItemColSpan(e.target.checked)}
                                          className="rounded text-amber-600"
                                        />
                                        <span>Merge 2 columns (colSpan=2)</span>
                                      </label>
                                    </div>
                                  </td>
                                  <td className="p-2 align-middle text-right">
                                    <div className="flex flex-col items-end gap-1.5">
                                      <input
                                        type="number"
                                        step="any"
                                        value={newSectionItemAmount}
                                        onChange={(e) => setNewSectionItemAmount(e.target.value)}
                                        placeholder="Amount (Rs)"
                                        className="w-24 sm:w-28 px-2 py-1 text-xs text-right font-bold rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleSaveItemToSection(sec.id)
                                        }}
                                      />
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveItemToSection(sec.id)}
                                          className="px-2 py-1 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setAddingToSectionId(null)}
                                          className="px-2 py-1 rounded text-xs font-bold bg-neutral-500 hover:bg-neutral-600 text-white cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* C. CYAN TOTAL ROW AT THE BOTTOM OF INCLUDED DETAILS (AUTOMATICALLY CALCULATED) */}
                              {sec.showTotal && (
                                <tr className="bg-[#7dd3fc] dark:bg-sky-300 text-neutral-950 font-bold border-b-2 border-neutral-900 print:bg-[#7dd3fc]!">
                                  <td
                                    colSpan={canEdit ? 3 : 2}
                                    className="py-2.5 px-4 font-extrabold text-xs sm:text-sm text-center"
                                  >
                                    <span>{sec.totalLabel || "Total"}</span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right tabular-nums font-extrabold text-xs sm:text-sm">
                                    {money(sectionTotal)}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        }
                      } else {
                        // Standalone Row
                        elements.push(renderRow(item, typeMerges))
                      }
                    })

                    // Fallback for any empty sections created with 0 items
                    typeSections.forEach((sec) => {
                      if (!renderedSectionIds.has(sec.id)) {
                        elements.push(
                          <tr key={sec.id} className="bg-[#fef08a] dark:bg-yellow-300 text-neutral-950 font-bold text-center border-y-2 border-neutral-900 print:bg-[#fef08a]!">
                            <td colSpan={canEdit ? 4 : 3} className="py-2.5 px-4 text-center text-xs sm:text-sm font-extrabold tracking-wide">
                              <span>{sec.bannerTitle}</span>
                            </td>
                          </tr>
                        )
                      }
                    })

                    return elements
                  })()}
                </>
              )}

              {/* Inline Form to add a new standalone item */}
              {canEdit && addingStandaloneType === type && (
                <tr className="bg-amber-100/60 dark:bg-amber-950/40 border-y-2 border-amber-500 print:hidden">
                  {canEdit && <td className="p-2 border-r border-neutral-900 dark:border-neutral-700"></td>}
                  <td className="p-2 border-r border-neutral-900 dark:border-neutral-700">
                    <input
                      type="text"
                      value={newStandaloneName}
                      onChange={(e) => setNewStandaloneName(e.target.value)}
                      placeholder="Description (e.g. Cash withdrawn from Bank)"
                      className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none font-bold text-center"
                      autoFocus
                    />
                  </td>
                  <td className="p-2 border-r border-neutral-900 dark:border-neutral-700">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={newStandaloneDetail}
                        onChange={(e) => setNewStandaloneDetail(e.target.value)}
                        placeholder="Detail bullet (optional)"
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                      />
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newStandaloneColSpan}
                          onChange={(e) => setNewStandaloneColSpan(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>Merge across 2 columns (colSpan=2)</span>
                      </label>
                    </div>
                  </td>
                  <td className="p-2 align-middle text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <input
                        type="number"
                        step="any"
                        value={newStandaloneAmount}
                        onChange={(e) => setNewStandaloneAmount(e.target.value)}
                        placeholder="Amount (Rs)"
                        className="w-24 sm:w-28 px-2 py-1 text-xs text-right font-bold rounded border border-neutral-300 bg-white dark:bg-neutral-900 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveStandalone(type)
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveStandalone(type)}
                          className="px-2 py-1 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingStandaloneType(null)}
                          className="px-2 py-1 rounded text-xs font-bold bg-neutral-500 hover:bg-neutral-600 text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Grand Total Row at Bottom */}
            <tfoot>
              <tr className={`${totalBg} text-neutral-950 font-extrabold border-t-2 border-neutral-900`}>
                <td
                  colSpan={canEdit ? 3 : 2}
                  className="py-2.5 px-4 font-extrabold text-xs sm:text-base text-center"
                >
                  {totalLabel}
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums font-extrabold text-xs sm:text-base">
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
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Income Section */}
      {renderTable(
        "income",
        incomeItems,
        totalIncome,
        "Total Income",
        "bg-[#9ca3af] dark:bg-neutral-400 print:bg-[#9ca3af]!"
      )}

      {/* 2. Expenditure Section */}
      {renderTable(
        "expense",
        expenseItems,
        totalExpense,
        "Total Expenditure",
        "bg-[#fde047] dark:bg-yellow-300 print:bg-[#fde047]!"
      )}

      {/* 3. Final Accounting Summary Block (Matching Page 6 of PDF) */}
      <section className="pt-2">
        <div className="w-full border-2 border-neutral-900 dark:border-neutral-700 divide-y-2 divide-neutral-900 dark:divide-neutral-700 text-xs sm:text-base font-extrabold">
          <div className="flex items-center justify-between bg-[#9ca3af] dark:bg-neutral-400 text-neutral-950 px-3 sm:px-4 py-2 sm:py-2.5 print:bg-[#9ca3af]!">
            <span>Total Income</span>
            <span className="tabular-nums text-sm sm:text-lg">{money(totalIncome)}</span>
          </div>
          <div className="flex items-center justify-between bg-[#fde047] dark:bg-yellow-300 text-neutral-950 px-3 sm:px-4 py-2 sm:py-2.5 print:bg-[#fde047]!">
            <span>Total Expenditure</span>
            <span className="tabular-nums text-sm sm:text-lg">{money(totalExpense)}</span>
          </div>
          <div className="flex items-center justify-between bg-[#4ade80] dark:bg-emerald-400 text-neutral-950 px-3 sm:px-4 py-2.5 sm:py-3 print:bg-[#4ade80]!">
            <span className="text-sm sm:text-lg">
              {net >= 0 ? "Cash in Hand (Surplus)" : "Net Deficit"}
            </span>
            <span className="tabular-nums text-base sm:text-xl font-black">{money(Math.abs(net))}</span>
          </div>
        </div>
      </section>

      {/* 4. Institutional Signatures Block */}
      <ReportSignatures locale={locale} />
    </div>
  )
}

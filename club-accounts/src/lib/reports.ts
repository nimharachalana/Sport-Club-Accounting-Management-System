import { createClient } from '@/lib/supabase/server'

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(fn, args)
  if (error) {
    // If the database function is not yet installed in Supabase (PGRST202), provide seamless fallback
    if (fn === 'report_income_expenditure' && (error.code === 'PGRST202' || error.message?.includes('not find'))) {
      const pFrom = String(args.p_from || '')
      const pTo = String(args.p_to || '')
      const { data: txs } = await supabase
        .from('transactions')
        .select('type, amount, category_id, categories(id, name_en, name_si)')
        .gte('tx_date', pFrom)
        .lte('tx_date', pTo)

      if (!txs || txs.length === 0) return [] as T[]

      const map = new Map<string, { section: 'income' | 'expense'; category_id: string; name_en: string; name_si: string | null; amount: number }>()

      for (const tx of txs) {
        const cat = tx.categories as unknown as { id: string; name_en: string; name_si: string | null } | null
        const catId = tx.category_id || cat?.id || 'unassigned'
        const section = tx.type === 'income' ? ('income' as const) : ('expense' as const)
        const nameEn = cat?.name_en || (section === 'income' ? 'General Income' : 'General Expense')
        const nameSi = cat?.name_si || null
        const key = `${section}_${catId}`

        const existing = map.get(key)
        if (existing) {
          existing.amount += Number(tx.amount || 0)
        } else {
          map.set(key, {
            section,
            category_id: catId,
            name_en: nameEn,
            name_si: nameSi,
            amount: Number(tx.amount || 0),
          })
        }
      }

      const rows = Array.from(map.values()).sort((a, b) => {
        if (a.section !== b.section) return a.section === 'income' ? -1 : 1
        return b.amount - a.amount
      })

      return rows as unknown as T[]
    }

    throw new Error(`${fn}: ${error.message}`)
  }
  return (data ?? []) as T[]
}

export async function getSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('club_name, currency')
    .eq('id', 1)
    .single()

  if (error) {
    return {
      club_name: 'Sport Club',
      currency: 'Rs.',
    }
  }
  return data
}

export type IERow = {
  section: 'income' | 'expense'
  category_id: string
  name_en: string
  name_si: string | null
  amount: number
}

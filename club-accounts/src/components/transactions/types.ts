export interface Category {
  id: string
  type: 'income' | 'expense'
  name_en: string
  name_si: string
}

export interface TransactionPhoto {
  id: string
  transaction_id: string
  storage_path: string
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  tx_date: string
  amount: number
  category_id: string
  party: string
  bill_no: string | null
  method: 'cash' | 'bank'
  note: string | null
  created_by: string
  created_at: string
  category?: Category | null
  photos?: TransactionPhoto[]
}

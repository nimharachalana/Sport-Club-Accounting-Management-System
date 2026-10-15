import { z } from 'zod'

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  tx_date: z.string().min(1, 'Date is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  category_id: z.string().min(1, 'Please select a valid category'),
  party: z.string().trim().min(1, 'Party or member name is required'),
  bill_no: z.string().trim().optional(),
  method: z.enum(['cash', 'bank']),
  note: z.string().trim().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

export interface TransactionInput {
  type: 'income' | 'expense'
  tx_date: string
  amount: number
  category_id: string
  party: string
  bill_no?: string | null
  method: 'cash' | 'bank'
  note?: string | null
}

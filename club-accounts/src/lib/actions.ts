'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import type { TransactionInput } from '@/lib/validations/transaction'

/**
 * Creates a new transaction and returns its generated id
 */
export async function createTransaction(values: TransactionInput): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      type: values.type,
      tx_date: values.tx_date,
      amount: values.amount,
      category_id: values.category_id,
      party: values.party,
      bill_no: values.bill_no || null,
      method: values.method,
      note: values.note || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    throw new Error(error.message)
  }

  revalidatePath('/')
  revalidatePath('/transactions')
  revalidatePath('/reports')
  revalidatePath('/reports/income-expenditure')
  return data.id
}

/**
 * Updates an existing transaction and removes any discarded photos from storage
 */
export async function updateTransaction(
  id: string,
  values: TransactionInput,
  removedPhotoIds: string[] = []
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      type: values.type,
      tx_date: values.tx_date,
      amount: values.amount,
      category_id: values.category_id,
      party: values.party,
      bill_no: values.bill_no || null,
      method: values.method,
      note: values.note || null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating transaction:', error)
    throw new Error(error.message)
  }

  // Clean up removed photos from storage bucket 'bills' and DB
  if (removedPhotoIds && removedPhotoIds.length > 0) {
    const { data: photosToDelete } = await supabase
      .from('transaction_photos')
      .select('id, storage_path')
      .in('id', removedPhotoIds)

    if (photosToDelete && photosToDelete.length > 0) {
      const paths = photosToDelete.map((p) => p.storage_path)
      try {
        await supabase.storage.from('bills').remove(paths)
      } catch (err) {
        console.warn('Could not remove files from storage bucket bills:', err)
      }
    }

    await supabase
      .from('transaction_photos')
      .delete()
      .in('id', removedPhotoIds)
  }

  revalidatePath('/transactions')
  revalidatePath('/')
  revalidatePath('/reports')
  revalidatePath('/reports/income-expenditure')
}

/**
 * Deletes a transaction and removes its photos from the private 'bills' storage bucket
 */
export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  // Fetch photos to remove from 'bills' bucket
  const { data: photos } = await supabase
    .from('transaction_photos')
    .select('storage_path')
    .eq('transaction_id', id)

  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path)
    try {
      await supabase.storage.from('bills').remove(paths)
    } catch (err) {
      console.warn('Could not remove photo files from storage bills:', err)
    }
  }

  // Delete transaction photo records
  await supabase.from('transaction_photos').delete().eq('transaction_id', id)

  // Delete transaction record
  const { error } = await supabase.from('transactions').delete().eq('id', id)

  if (error) {
    console.error('Error deleting transaction:', error)
    throw new Error(error.message)
  }

  revalidatePath('/transactions')
  revalidatePath('/')
  revalidatePath('/reports')
  revalidatePath('/reports/income-expenditure')
}

/**
 * Creates a new category (income or expense) and returns the record
 */
export async function createCategory(values: {
  type: 'income' | 'expense'
  name_en: string
  name_si?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      type: values.type,
      name_en: values.name_en.trim(),
      name_si: values.name_si?.trim() || values.name_en.trim(),
    })
    .select('id, type, name_en, name_si')
    .single()

  if (error) {
    console.error('Error creating category:', error)
    throw new Error(error.message)
  }

  revalidatePath('/transactions')
  revalidatePath('/')
  return data
}

/**
 * Creates a new viewer account (restricted to admin users only)
 */
export async function addViewer(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (me?.role !== 'admin') {
    throw new Error('Admins only')
  }

  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '').trim()
  const name = String(formData.get('name') || '').trim()

  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    throw new Error('Server environment missing Supabase configuration')
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (error) {
    console.error('Error creating viewer:', error)
    throw new Error(error.message)
  }

  if (newUser?.user) {
    // Ensure profile reflects the provided full name and viewer role
    await admin
      .from('profiles')
      .update({
        full_name: name || email.split('@')[0],
        role: 'viewer',
      })
      .eq('id', newUser.user.id)
  }

  revalidatePath('/people')
}

/**
 * Removes a viewer account (restricted to admin users only)
 */
export async function removeViewer(userId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (me?.role !== 'admin') {
    throw new Error('Admins only')
  }

  if (user.id === userId) {
    throw new Error('Cannot delete your own account')
  }

  // Ensure target user is not an admin
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (targetProfile?.role === 'admin') {
    throw new Error('Cannot remove an admin user')
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    throw new Error('Server environment missing Supabase configuration')
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    console.error('Error removing viewer:', error)
    throw new Error(error.message)
  }

  revalidatePath('/people')
}

/**
 * Updates club settings (club name, currency, opening balances)
 */
export async function updateSettings(values: {
  club_name: string
  currency: string
  opening_cash?: number
  opening_bank?: number
}): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (me?.role !== 'admin') {
    throw new Error('Admins only')
  }

  const { error } = await supabase
    .from('settings')
    .update({
      club_name: values.club_name.trim(),
      currency: values.currency.trim() || 'Rs.',
      opening_cash: Number(values.opening_cash || 0),
      opening_bank: Number(values.opening_bank || 0),
    })
    .eq('id', 1)

  if (error) {
    console.error('Error updating settings:', error)
    throw new Error(error.message)
  }

  revalidatePath('/settings')
  revalidatePath('/')
  revalidatePath('/reports')
  revalidatePath('/reports/income-expenditure')
}

/**
 * Updates an existing category's English and Sinhala names
 */
export async function updateCategory(
  id: string,
  values: { name_en: string; name_si?: string }
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (me?.role !== 'admin') {
    throw new Error('Admins only')
  }

  const { error } = await supabase
    .from('categories')
    .update({
      name_en: values.name_en.trim(),
      name_si: values.name_si?.trim() || values.name_en.trim(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating category:', error)
    throw new Error(error.message)
  }

  revalidatePath('/settings')
  revalidatePath('/transactions')
  revalidatePath('/reports')
  revalidatePath('/reports/income-expenditure')
  revalidatePath('/')
}

/**
 * Safely deletes an unused category
 */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not signed in')
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (me?.role !== 'admin') {
    throw new Error('Admins only')
  }

  // Check if any transactions are using this category
  const { count, error: countErr } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (countErr) {
    throw new Error(countErr.message)
  }

  if (count && count > 0) {
    throw new Error(`Cannot delete this category: ${count} transaction(s) are currently linked to it.`)
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    throw new Error(error.message)
  }

  revalidatePath('/settings')
  revalidatePath('/transactions')
  revalidatePath('/reports')
  revalidatePath('/reports/income-expenditure')
  revalidatePath('/')
}


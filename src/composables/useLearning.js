import { supabase } from '../lib/supabase'

export function useLearning() {
  async function fetchEntriesByDate(date) {
    const { data, error } = await supabase
      .from('daily_learning_entries')
      .select('*')
      .eq('entry_date', date)
      .order('created_at')
    return { data: data || [], error }
  }

  async function fetchEntriesByRange(from, to, { category, status } = {}) {
    let q = supabase
      .from('daily_learning_entries')
      .select('*')
      .gte('entry_date', from)
      .lte('entry_date', to)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (category && category !== '全部') q = q.eq('category', category)
    if (status && status !== '全部') q = q.eq('status', status)
    const { data, error } = await q
    return { data: data || [], error }
  }

  async function upsertEntry(fields) {
    let q
    if (fields.id) {
      const { id, created_at, ...rest } = fields
      q = supabase.from('daily_learning_entries').update(rest).eq('id', id).select().single()
    } else {
      const { id, created_at, ...rest } = fields
      q = supabase.from('daily_learning_entries').insert(rest).select().single()
    }
    return await q
  }

  async function deleteEntry(id) {
    return await supabase.from('daily_learning_entries').delete().eq('id', id)
  }

  return { fetchEntriesByDate, fetchEntriesByRange, upsertEntry, deleteEntry }
}

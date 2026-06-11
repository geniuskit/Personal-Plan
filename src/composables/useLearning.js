import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useLearning() {
  const items = ref([])

  async function fetchLearningItems({ status, category } = {}) {
    let q = supabase.from('learning_items').select('*').order('created_at', { ascending: false })
    if (status && status !== '全部') q = q.eq('status', status)
    if (category && category !== '全部') q = q.eq('category', category)
    const { data, error } = await q
    if (!error) items.value = data || []
    return { data: data || [], error }
  }

  async function fetchActiveItems() {
    const { data, error } = await supabase
      .from('learning_items')
      .select('*')
      .eq('status', '進行中')
      .order('updated_at', { ascending: false })
    return { data: data || [], error }
  }

  async function upsertLearningItem(fields) {
    const payload = { ...fields, updated_at: new Date().toISOString() }
    let q
    if (fields.id) {
      q = supabase.from('learning_items').update(payload).eq('id', fields.id).select().single()
    } else {
      const { id: _id, ...rest } = payload
      q = supabase.from('learning_items').insert(rest).select().single()
    }
    const { data, error } = await q
    if (!error) {
      const idx = items.value.findIndex(i => i.id === data.id)
      if (idx !== -1) items.value[idx] = data
      else items.value.unshift(data)
    }
    return { data, error }
  }

  async function deleteLearningItem(id) {
    const { error } = await supabase.from('learning_items').delete().eq('id', id)
    if (!error) items.value = items.value.filter(i => i.id !== id)
    return { error }
  }

  return { items, fetchLearningItems, fetchActiveItems, upsertLearningItem, deleteLearningItem }
}

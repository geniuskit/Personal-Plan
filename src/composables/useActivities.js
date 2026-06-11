import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const activities = ref([])
const loaded = ref(false)

export function useActivities() {
  async function fetchActivities() {
    const { data, error } = await supabase
      .from('activity_templates')
      .select('*')
      .order('sort_order')
    if (!error) {
      activities.value = data
      loaded.value = true
    }
    return { data, error }
  }

  async function addActivity(name, defaultUnit = 'hr') {
    const maxOrder = activities.value.reduce((m, a) => Math.max(m, a.sort_order), 0)
    const { data, error } = await supabase
      .from('activity_templates')
      .insert({ name, default_unit: defaultUnit, sort_order: maxOrder + 1 })
      .select()
      .single()
    if (!error) activities.value.push(data)
    return { data, error }
  }

  async function updateActivity(id, updates) {
    const { data, error } = await supabase
      .from('activity_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      const idx = activities.value.findIndex(a => a.id === id)
      if (idx !== -1) activities.value[idx] = data
    }
    return { data, error }
  }

  async function deleteActivity(id) {
    const { error } = await supabase.from('activity_templates').delete().eq('id', id)
    if (!error) activities.value = activities.value.filter(a => a.id !== id)
    return { error }
  }

  async function reorderActivities(orderedIds) {
    const updates = orderedIds.map((id, idx) => ({ id, sort_order: idx + 1 }))
    for (const u of updates) {
      await supabase.from('activity_templates').update({ sort_order: u.sort_order }).eq('id', u.id)
    }
    await fetchActivities()
  }

  return { activities, loaded, fetchActivities, addActivity, updateActivity, deleteActivity, reorderActivities }
}

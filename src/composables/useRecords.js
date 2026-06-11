import { supabase } from '../lib/supabase'

export function useRecords() {
  async function fetchRecord(date) {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*, activity_records(*, activity_templates(*))')
      .eq('record_date', date)
      .maybeSingle()
    return { data, error }
  }

  async function fetchRecordsByRange(from, to) {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*, activity_records(*, activity_templates(*))')
      .gte('record_date', from)
      .lte('record_date', to)
      .order('record_date', { ascending: false })
    return { data: data || [], error }
  }

  async function fetchDatesWithRecords(year, month) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    const { data, error } = await supabase
      .from('daily_records')
      .select('record_date')
      .gte('record_date', from)
      .lte('record_date', to)
    return { dates: (data || []).map(r => r.record_date), error }
  }

  async function upsertRecord(date, fields) {
    const { data, error } = await supabase
      .from('daily_records')
      .upsert({ record_date: date, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'record_date' })
      .select()
      .single()
    return { data, error }
  }

  async function upsertActivityRecord(dailyRecordId, activityId, fields) {
    const { data, error } = await supabase
      .from('activity_records')
      .upsert(
        { daily_record_id: dailyRecordId, activity_id: activityId, ...fields },
        { onConflict: 'daily_record_id,activity_id' }
      )
      .select()
      .single()
    return { data, error }
  }

  async function deleteRecord(date) {
    const { error } = await supabase.from('daily_records').delete().eq('record_date', date)
    return { error }
  }

  async function fetchStreakAndStats() {
    const { data } = await supabase
      .from('daily_records')
      .select('record_date')
      .order('record_date', { ascending: false })
      .limit(60)

    if (!data || data.length === 0) return { streak: 0, total: 0 }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateSet = new Set(data.map(r => r.record_date))

    let streak = 0
    const check = new Date(today)
    while (true) {
      const key = check.toISOString().slice(0, 10)
      if (!dateSet.has(key)) break
      streak++
      check.setDate(check.getDate() - 1)
    }

    return { streak, total: data.length }
  }

  return {
    fetchRecord,
    fetchRecordsByRange,
    fetchDatesWithRecords,
    upsertRecord,
    upsertActivityRecord,
    deleteRecord,
    fetchStreakAndStats,
  }
}

import { supabase } from '../lib/supabase'

export function usePmLogs() {
  // 取某專案歷程（依天數→日期由大到小），可限制筆數
  async function fetchLogs(projectId, { limit } = {}) {
    let q = supabase
      .from('pm_project_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('day_number', { ascending: false, nullsFirst: false })
      .order('log_date', { ascending: false, nullsFirst: false })
    if (limit) q = q.limit(limit)
    const { data, error } = await q
    return { data: data || [], error }
  }

  // 取目前最大天數（新增時自動帶入）
  async function maxDayNumber(projectId) {
    const { data } = await supabase
      .from('pm_project_logs')
      .select('day_number')
      .eq('project_id', projectId)
      .order('day_number', { ascending: false, nullsFirst: false })
      .limit(1)
    return (data && data[0] && data[0].day_number) || 0
  }

  async function upsertLog(fields) {
    if (fields.id) {
      const { id, created_at, ...rest } = fields
      return await supabase.from('pm_project_logs').update(rest).eq('id', id).select().single()
    }
    const { id, created_at, ...rest } = fields
    return await supabase.from('pm_project_logs').insert(rest).select().single()
  }

  async function deleteLog(id) {
    return await supabase.from('pm_project_logs').delete().eq('id', id)
  }

  return { fetchLogs, maxDayNumber, upsertLog, deleteLog }
}

// 將逐筆歷程依 day_number 分組合併（顯示用）
// 回傳：[{ day_number, dates:[], totalMin, totalItems, contents:[], entries:[原始筆] }]，依天數由大到小
export function groupLogsByDay(logs) {
  const map = new Map()
  for (const l of logs) {
    const key = l.day_number == null ? '_' : l.day_number
    if (!map.has(key)) {
      map.set(key, { day_number: l.day_number, dates: [], totalMin: 0, totalItems: 0, contents: [], entries: [] })
    }
    const g = map.get(key)
    g.entries.push(l)
    if (l.log_date) g.dates.push(l.log_date)
    g.totalMin += l.duration_min || 0
    g.totalItems += l.item_count || 0
    if (l.content) g.contents.push(l.content)
  }
  const groups = [...map.values()]
  groups.forEach(g => g.dates.sort())
  groups.sort((a, b) => (b.day_number ?? -1) - (a.day_number ?? -1))
  return groups
}

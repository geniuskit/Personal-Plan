import { supabase } from '../lib/supabase'

// ── 狀態常數 ────────────────────────────────────────────────
// 專案：0未啟動 1進行中 2暫擱 3結案 4棄置
export const PROJECT_STATUS = [
  { v: 0, label: '未啟動', cls: 'bg-slate-700 text-slate-400' },
  { v: 1, label: '進行中', cls: 'bg-green-900 text-green-300' },
  { v: 2, label: '暫擱',   cls: 'bg-yellow-900 text-yellow-300' },
  { v: 3, label: '結案',   cls: 'bg-blue-900 text-blue-300' },
  { v: 4, label: '棄置',   cls: 'bg-red-900 text-red-400' },
]
// 階段／細項：0未啟動 1進行中 2暫擱 3完成 4棄置
export const SESSION_STATUS = [
  { v: 0, label: '未啟動', cls: 'bg-slate-700 text-slate-400' },
  { v: 1, label: '進行中', cls: 'bg-green-900 text-green-300' },
  { v: 2, label: '暫擱',   cls: 'bg-yellow-900 text-yellow-300' },
  { v: 3, label: '完成',   cls: 'bg-blue-900 text-blue-300' },
  { v: 4, label: '棄置',   cls: 'bg-red-900 text-red-400' },
]

export function statusMeta(list, v) {
  return list.find(s => s.v === Number(v)) || list[0]
}

// ── 日期輔助 ────────────────────────────────────────────────
export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 以 UTC 基準計算兩個 yyyy-mm-dd 相差天數，避開時區/DST 問題
export function daysBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return null
  const [fy, fm, fd] = fromStr.split('-').map(Number)
  const [ty, tm, td] = toStr.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000)
}

// ── 統計輔助（傳入含巢狀 logs / sessions 的專案物件）──────────
export function totalMinutes(p) {
  return (p.pm_project_logs || []).reduce((s, l) => s + (l.duration_min || 0), 0)
}
export function totalItems(p) {
  return (p.pm_project_logs || []).reduce((s, l) => s + (l.item_count || 0), 0)
}
export function dayCount(p) {
  const set = new Set()
  for (const l of p.pm_project_logs || []) {
    if (l.day_number != null) set.add(l.day_number)
  }
  return set.size
}
export function lastUpdated(p) {
  let max = null
  for (const l of p.pm_project_logs || []) {
    if (l.log_date && (!max || l.log_date > max)) max = l.log_date
  }
  return max
}
export function idleDays(p) {
  if (Number(p.status) !== 1) return null // 只有「進行中」才計算長草日
  const last = lastUpdated(p)
  if (!last) return null
  return daysBetween(last, todayStr())
}
// 細項統計：完成(3)數 / 未棄置(≠4)數
function detailsOf(p) {
  return (p.pm_sessions || []).flatMap(s => s.pm_session_details || [])
}
export function projectProgress(p) {
  const details = detailsOf(p)
  const total = details.filter(d => Number(d.status) !== 4).length
  const done = details.filter(d => Number(d.status) === 3).length
  return { done, total }
}
export function sessionProgress(session) {
  const details = session.pm_session_details || []
  const total = details.filter(d => Number(d.status) !== 4).length
  const done = details.filter(d => Number(d.status) === 3).length
  return { done, total }
}
export function formatHr(min) {
  if (!min) return '0hr'
  return (min / 60).toFixed(1).replace(/\.0$/, '') + 'hr'
}

// ── 資料存取 ────────────────────────────────────────────────
export function usePmProjects() {
  // 分類
  async function fetchCategories() {
    const { data, error } = await supabase
      .from('pm_categories').select('*').order('sort_order')
    return { data: data || [], error }
  }
  async function addCategory(name, sortOrder = 0) {
    return await supabase.from('pm_categories')
      .insert({ name, sort_order: sortOrder }).select().single()
  }
  async function updateCategory(id, fields) {
    return await supabase.from('pm_categories').update(fields).eq('id', id).select().single()
  }
  async function deleteCategory(id) {
    return await supabase.from('pm_categories').delete().eq('id', id)
  }
  async function reorderCategories(ids) {
    await Promise.all(ids.map((id, i) =>
      supabase.from('pm_categories').update({ sort_order: i }).eq('id', id)))
  }

  // 專案（純主檔清單）
  async function fetchProjects() {
    const { data, error } = await supabase
      .from('pm_projects').select('*').order('sort_order')
    return { data: data || [], error }
  }

  // 專案 + 巢狀 logs / sessions(details)，供 Dashboard / 維護頁計算統計
  async function fetchProjectsFull() {
    const { data, error } = await supabase
      .from('pm_projects')
      .select('*, pm_project_logs(day_number,log_date,duration_min,item_count), pm_sessions(id,name,status,sort_order,pm_session_details(status))')
      .order('sort_order')
    return { data: data || [], error }
  }

  async function upsertProject(fields) {
    if (fields.id) {
      const { id, created_at, pm_project_logs, pm_sessions, pm_categories, ...rest } = fields
      return await supabase.from('pm_projects')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    }
    const { id, created_at, pm_project_logs, pm_sessions, pm_categories, ...rest } = fields
    return await supabase.from('pm_projects').insert(rest).select().single()
  }

  async function deleteProject(id) {
    return await supabase.from('pm_projects').delete().eq('id', id)
  }

  return {
    fetchCategories, addCategory, updateCategory, deleteCategory, reorderCategories,
    fetchProjects, fetchProjectsFull, upsertProject, deleteProject,
  }
}

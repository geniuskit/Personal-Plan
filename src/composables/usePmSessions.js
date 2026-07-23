import { supabase } from '../lib/supabase'

export function usePmSessions() {
  // 取某專案的階段 + 細項
  async function fetchSessions(projectId) {
    const { data, error } = await supabase
      .from('pm_sessions')
      .select('*, pm_session_details(*)')
      .eq('project_id', projectId)
      .order('sort_order')
    const sessions = data || []
    // 細項依 sort_order 排序
    sessions.forEach(s => (s.pm_session_details || []).sort((a, b) => a.sort_order - b.sort_order))
    return { data: sessions, error }
  }

  // ── 階段 ──
  async function addSession(projectId, name, sortOrder = 0, status = 0) {
    return await supabase.from('pm_sessions')
      .insert({ project_id: projectId, name, sort_order: sortOrder, status }).select().single()
  }
  async function updateSession(id, fields) {
    return await supabase.from('pm_sessions').update(fields).eq('id', id).select().single()
  }
  async function deleteSession(id) {
    return await supabase.from('pm_sessions').delete().eq('id', id)
  }

  // ── 細項 ──
  async function addDetail(sessionId, fields, sortOrder = 0) {
    return await supabase.from('pm_session_details')
      .insert({ session_id: sessionId, sort_order: sortOrder, ...fields }).select().single()
  }
  async function updateDetail(id, fields) {
    return await supabase.from('pm_session_details').update(fields).eq('id', id).select().single()
  }
  async function deleteDetail(id) {
    return await supabase.from('pm_session_details').delete().eq('id', id)
  }

  return {
    fetchSessions,
    addSession, updateSession, deleteSession,
    addDetail, updateDetail, deleteDetail,
  }
}

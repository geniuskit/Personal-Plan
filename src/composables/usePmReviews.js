import { supabase } from '../lib/supabase'

export function usePmReviews() {
  async function fetchReviews(projectId) {
    const { data, error } = await supabase
      .from('pm_reviews')
      .select('*')
      .eq('project_id', projectId)
      .order('review_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    return { data: data || [], error }
  }

  async function upsertReview(fields) {
    if (fields.id) {
      const { id, created_at, ...rest } = fields
      return await supabase.from('pm_reviews').update(rest).eq('id', id).select().single()
    }
    const { id, created_at, ...rest } = fields
    return await supabase.from('pm_reviews').insert(rest).select().single()
  }

  async function deleteReview(id) {
    return await supabase.from('pm_reviews').delete().eq('id', id)
  }

  return { fetchReviews, upsertReview, deleteReview }
}

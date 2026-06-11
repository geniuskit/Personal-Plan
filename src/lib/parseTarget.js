/**
 * 將目標字串轉換為分鐘數
 * 支援格式：">1hr"、"1hr"、"30m"、"30min"、"45"（預設 min）
 */
export function toMinutes(val, unit) {
  const num = parseFloat(String(val || '').replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return null
  const u = (unit || 'min').toLowerCase()
  if (u === 'hr') return num * 60
  if (u === 'km') return num // km 不換算，直接比較
  return num // min、次、組 等直接用數字
}

export function targetToMinutes(str) {
  if (!str) return null
  const s = str.trim().toLowerCase()
  const num = parseFloat(s.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return null
  if (s.includes('hr') || s.endsWith('h')) return num * 60
  if (s.includes('min') || s.endsWith('m')) return num
  return num // 無單位，直接用數字（次、組、km 等）
}

/**
 * 判斷達成等級
 * @returns 'high' | 'mid' | 'low' | 'miss' | null
 */
export function getAchieveLevel(rec) {
  if (!rec.actual_result) return null
  const actual = toMinutes(rec.actual_result, rec.unit)
  if (actual === null) return null
  if (rec.high_target && targetToMinutes(rec.high_target) !== null && actual >= targetToMinutes(rec.high_target)) return 'high'
  if (rec.mid_target && targetToMinutes(rec.mid_target) !== null && actual >= targetToMinutes(rec.mid_target)) return 'mid'
  if (rec.low_target && targetToMinutes(rec.low_target) !== null && actual >= targetToMinutes(rec.low_target)) return 'low'
  if (rec.high_target || rec.mid_target || rec.low_target) return 'miss'
  return null
}

/**
 * 取得進度條百分比（0~100）
 */
export function getProgressPct(rec) {
  if (!rec.actual_result) return 0
  const actual = toMinutes(rec.actual_result, rec.unit)
  const ref = targetToMinutes(rec.low_target) ?? targetToMinutes(rec.mid_target) ?? targetToMinutes(rec.high_target)
  if (actual === null || ref === null || ref === 0) return actual !== null ? 100 : 0
  return Math.min(100, Math.round((actual / ref) * 100))
}

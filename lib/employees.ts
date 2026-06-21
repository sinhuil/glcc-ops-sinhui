import { supabase, supabaseConfigured } from './supabase'

// One row = one team member. Lives in its own `employees` table (created by
// supabase/employees.sql) so HR can track employment type + working hours
// cleanly, separate from the universal `records` table the other tabs use.
export type Employee = {
  id: number
  name: string
  role: string | null
  department: string | null
  employment_type: string   // 'full_time' | 'part_time'
  status: string            // 'active' | 'on_leave' | 'probation' | 'left'
  hourly_rate: number       // RM per hour
  weekly_hours: number      // contracted hours per week
  start_date: string | null
  email: string | null
  work_days: string[] | null  // e.g. ['Mon','Tue','Wed','Thu','Fri']
  created_at: string
}

export async function getEmployees(): Promise<Employee[]> {
  // Skip the call before Supabase is wired (placeholder env) — same guard as
  // getRecords. If the employees table doesn't exist yet, we log and return []
  // so the HR tab shows its "run employees.sql" hint instead of crashing.
  if (!supabaseConfigured) return []
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true })
  if (error) {
    console.warn('[GLCC] could not read employees:', error.message)
    return []
  }
  return (data ?? []) as Employee[]
}

// 'full_time' -> 'full time', 'on_leave' -> 'on leave' (for display only;
// the raw value still drives the .pill CSS class).
export const labelize = (s: string) => s.replace(/_/g, ' ')

// ---- Staff availability (8am digest + Telegram bot updates) ----
export const WORKING_STATUSES = ['active', 'probation']
export const LEAVE_LABEL: Record<string, string> = { mc: 'medical', annual_leave: 'annual', on_leave: 'leave' }
export const isWorking = (s: string) => WORKING_STATUSES.includes(s)
export const isOnLeave = (s: string) => s in LEAVE_LABEL

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "Today" in Malaysia (UTC+8), so a 00:00-UTC cron reads the correct weekday.
export function staffToday(team: Employee[]) {
  const myt = new Date(Date.now() + 8 * 3600 * 1000)
  const day = WD[myt.getUTCDay()]
  const dateLabel = `${day} ${myt.getUTCDate()} ${MO[myt.getUTCMonth()]}`
  const working = team.filter(e => isWorking(e.status) && (e.work_days ?? []).includes(day))
  const onLeave = team.filter(e => isOnLeave(e.status))
  const offToday = team.filter(e => isWorking(e.status) && !(e.work_days ?? []).includes(day))
  return { day, dateLabel, working, onLeave, offToday }
}

// The Telegram message body — shared by the cron and the on-demand bot reply.
export function staffMessage(team: Employee[]): string {
  const { dateLabel, working, onLeave, offToday } = staffToday(team)
  return (
    `☀️ <b>Staff today — ${dateLabel}</b>\n` +
    `\n✅ <b>Working (${working.length}):</b>\n` +
    (working.length ? working.map(e => `• ${e.name}${e.department ? ` <i>(${e.department})</i>` : ''}`).join('\n') : '• —') +
    (onLeave.length
      ? `\n\n🤒 <b>On leave (${onLeave.length}):</b>\n` + onLeave.map(e => `• ${e.name} — ${LEAVE_LABEL[e.status] ?? 'leave'}`).join('\n')
      : `\n\n🟢 Nobody on leave today.`) +
    (offToday.length ? `\n\n😴 <b>Off (not scheduled):</b> ${offToday.map(e => e.name).join(', ')}` : '')
  )
}

// Map a spoken intent ("medical", "back") to a DB status, then write it.
export const STATUS_FROM_INTENT: Record<string, string> = {
  working: 'active', medical: 'mc', annual: 'annual_leave', leave: 'on_leave',
}

export async function setEmployeeStatus(name: string, status: string): Promise<boolean> {
  if (!supabaseConfigured) return false
  const { error } = await supabase.from('employees').update({ status }).eq('name', name)
  if (error) { console.warn('[GLCC] setEmployeeStatus failed:', error.message); return false }
  return true
}

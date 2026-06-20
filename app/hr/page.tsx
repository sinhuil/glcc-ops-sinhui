import { getEmployees, labelize } from '@/lib/employees'
import { rm } from '@/lib/records'

export const dynamic = 'force-dynamic'

// Human Resources. Reads the dedicated `employees` table (supabase/employees.sql).
export default async function HR() {
  const team = await getEmployees()

  const fullTime = team.filter(e => e.employment_type === 'full_time').length
  const partTime = team.filter(e => e.employment_type === 'part_time').length
  // Total contracted hours/week across everyone still on the team.
  const weeklyHours = team
    .filter(e => e.status !== 'left')
    .reduce((s, e) => s + Number(e.weekly_hours || 0), 0)

  const cards: [string, string | number][] = [
    ['Headcount', team.length],
    ['Full-time', fullTime],
    ['Part-time', partTime],
    ['Weekly hours', `${weeklyHours} h`],
  ]

  return (
    <>
      <h1 className="ph">HR</h1>
      <p className="cap">Your team &amp; working hours</p>
      <div className="grid">
        {cards.map(([l, v]) => (
          <div className="stat" key={l}><p className="l">{l}</p><p className="v">{v}</p></div>
        ))}
      </div>
      {team.length === 0 ? (
        <p className="empty">
          No employees yet — run <code>supabase/employees.sql</code> in your Supabase SQL editor
          to create the <code>employees</code> table and seed your team, then refresh.
        </p>
      ) : (
        <table className="tbl">
          <thead><tr>
            <th>Name</th><th>Role</th><th>Department</th><th>Type</th><th>Status</th><th>Hours/wk</th><th>Rate</th>
          </tr></thead>
          <tbody>
            {team.map(e => (
              <tr key={e.id}>
                <td data-label="Name">{e.name}</td>
                <td data-label="Role">{e.role ?? '—'}</td>
                <td data-label="Department">{e.department ?? '—'}</td>
                <td data-label="Type"><span className={`pill ${e.employment_type}`}>{labelize(e.employment_type)}</span></td>
                <td data-label="Status"><span className={`pill ${e.status}`}>{labelize(e.status)}</span></td>
                <td data-label="Hours/wk">{e.weekly_hours ? `${e.weekly_hours} h` : '—'}</td>
                <td data-label="Rate">{e.hourly_rate ? `${rm(e.hourly_rate)}/h` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

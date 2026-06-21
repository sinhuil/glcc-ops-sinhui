import { sendMessage } from '@/lib/telegram'
import { getEmployees, staffMessage } from '@/lib/employees'

export const dynamic = 'force-dynamic'

// Vercel Cron hits this daily at 00:00 UTC (= 08:00 Malaysia, UTC+8) and texts
// the owner today's staff roster. Locked down: returns 401 unless called with
// Authorization: Bearer $CRON_SECRET (Vercel Cron sends this automatically).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('forbidden', { status: 401 })
  }

  const team = (await getEmployees()).filter(e => e.status !== 'left')
  const owner = process.env.OWNER_CHAT_ID?.trim()
  if (owner) await sendMessage(owner, staffMessage(team))

  return Response.json({ ok: true, sent: !!owner, count: team.length })
}

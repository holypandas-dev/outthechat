import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'onboarding@resend.dev'

function tripUrl(origin: string, tripId: string) {
  return `${origin}/trip/${tripId}`
}

function fundUrl(origin: string, tripId: string) {
  return `${origin}/trip/${tripId}/fund`
}

function emailHtml(title: string, body: string, ctaLabel: string, ctaUrl: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a09;min-height:100vh">
    <tr><td align="center" style="padding:40px 16px">
      <table width="100%" style="max-width:520px">
        <tr><td style="padding-bottom:32px">
          <span style="font-family:monospace;font-size:15px">
            <span style="color:#e8623a">Out</span><span style="color:#f2ede4">TheChat</span>
          </span>
        </td></tr>
        <tr><td style="background:#141412;border:1px solid rgba(242,237,228,0.08);border-radius:16px;padding:32px">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#f2ede4;line-height:1.3">${title}</h1>
          <p style="margin:0 0 28px;font-size:14px;color:#b8b0a2;line-height:1.6">${body}</p>
          <a href="${ctaUrl}" style="display:inline-block;background:#e8623a;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px">${ctaLabel}</a>
        </td></tr>
        <tr><td style="padding-top:24px;font-size:12px;color:rgba(184,176,162,0.5);text-align:center">
          You're receiving this because you're part of a trip on OutTheChat.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId } = await request.json()
    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }

    // Verify caller is the trip organizer
    const { data: trip } = await supabase
      .from('trips')
      .select('id, title, creator_id, group_size, estimated_cost, updated_at, created_at')
      .eq('id', tripId)
      .single()

    if (!trip || trip.creator_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const origin = new URL(request.url).origin

    // Fetch all trip members with user IDs
    const { data: members } = await supabase
      .from('trip_members')
      .select('user_id, role')
      .eq('trip_id', tripId)

    if (!members || members.length === 0) {
      return NextResponse.json({ sent: [] })
    }

    const memberUserIds = members.map(m => m.user_id)

    // Fetch each member's email via admin client
    const emailMap: Record<string, string> = {}
    await Promise.all(
      memberUserIds.map(async (uid) => {
        const { data } = await adminSupabase.auth.admin.getUserById(uid)
        if (data.user?.email) emailMap[uid] = data.user.email
      })
    )

    const sent: string[] = []

    // ── Nudge 1: Members who haven't voted on any activity ──────────────────
    const { data: allActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('trip_id', tripId)

    if (allActivities && allActivities.length > 0) {
      // Get the set of user IDs that have cast at least one vote on this trip
      const { data: voterRows } = await supabase
        .from('votes')
        .select('user_id')
        .eq('trip_id', tripId)

      const voterIds = new Set((voterRows || []).map(v => v.user_id))
      const nonVoters = memberUserIds.filter(uid => !voterIds.has(uid))

      await Promise.all(
        nonVoters.map(async (uid) => {
          const email = emailMap[uid]
          if (!email) return
          await resend.emails.send({
            from: FROM,
            to: email,
            subject: `Your group is waiting for your vote on ${trip.title}`,
            html: emailHtml(
              `Your group is waiting for your vote`,
              `The crew is planning <strong style="color:#f2ede4">${trip.title}</strong> and your votes help shape the itinerary. Jump in and vote on the activities — it only takes a minute.`,
              'Vote on activities',
              tripUrl(origin, tripId)
            ),
          })
          sent.push(`vote-nudge:${email}`)
        })
      )
    }

    // ── Nudge 2: Fund under 50% of target ───────────────────────────────────
    const estimatedCost = trip.estimated_cost as Record<string, number> | null
    const midCost = estimatedCost?.mid ?? 0
    const goalAmount = Math.max(midCost * (trip.group_size ?? 1), 500)

    const { data: contributions } = await supabase
      .from('fund_contributions')
      .select('amount, status')
      .eq('trip_id', tripId)
      .eq('status', 'paid')

    const totalRaised = (contributions || []).reduce((sum, c) => sum + (c.amount ?? 0), 0) / 100 // stored in cents

    if (goalAmount > 0 && totalRaised < goalAmount * 0.5) {
      await Promise.all(
        memberUserIds.map(async (uid) => {
          const email = emailMap[uid]
          if (!email) return
          await resend.emails.send({
            from: FROM,
            to: email,
            subject: `Your ${trip.title} fund needs contributions`,
            html: emailHtml(
              `Your ${trip.title} fund needs contributions`,
              `The group fund is at <strong style="color:#f2ede4">$${totalRaised.toFixed(0)}</strong> of the <strong style="color:#f2ede4">$${goalAmount.toFixed(0)}</strong> goal. Every contribution brings the trip closer to reality.`,
              'Contribute to the fund',
              fundUrl(origin, tripId)
            ),
          })
          sent.push(`fund-nudge:${email}`)
        })
      )
    }

    // ── Nudge 3: No trip updates in 5+ days → email organizer ───────────────
    const lastUpdated = new Date(trip.updated_at ?? trip.created_at)
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceUpdate >= 5) {
      const organizerEmail = emailMap[user.id]
      if (organizerEmail) {
        await resend.emails.send({
          from: FROM,
          to: organizerEmail,
          subject: `Keep the momentum going on ${trip.title}`,
          html: emailHtml(
            `Keep the momentum going`,
            `It's been a few days since anything happened with <strong style="color:#f2ede4">${trip.title}</strong>. Your crew is probably waiting for a sign. Head back in and keep the energy alive.`,
            'Pick up where you left off',
            tripUrl(origin, tripId)
          ),
        })
        sent.push(`momentum-nudge:${organizerEmail}`)
      }
    }

    return NextResponse.json({ sent, count: sent.length })

  } catch (error) {
    console.error('Send nudges error:', error)
    return NextResponse.json({ error: 'Failed to send nudges' }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await request.json()
  if (!tripId) return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })

  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Not a trip member' }, { status: 403 })

  // Upsert commitment — no payment, just a declared intention
  const { error } = await supabase
    .from('fund_contributions')
    .upsert(
      { trip_id: tripId, user_id: user.id, amount: 0, status: 'committed' },
      { onConflict: 'trip_id,user_id' }
    )

  if (error) {
    console.error('Commit error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Recalculate commitment score based on committed members vs group size
  const admin = createAdminClient()

  const { data: trip } = await admin
    .from('trips')
    .select('group_size')
    .eq('id', tripId)
    .single()

  const { count: committedCount } = await admin
    .from('fund_contributions')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('status', 'committed')

  if (trip && committedCount !== null) {
    const groupSize = trip.group_size || 1
    // Score: 10 base + up to 80 points as members commit, capped at 90
    const score = Math.min(90, Math.round(10 + (committedCount / groupSize) * 80))
    await admin.from('trips').update({ commitment_score: score }).eq('id', tripId)
  }

  return NextResponse.json({ ok: true })
}

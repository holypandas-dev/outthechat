import { createClient } from '@/lib/supabase/server'
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

  return NextResponse.json({ ok: true })
}

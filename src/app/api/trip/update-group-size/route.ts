import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId, groupSize } = await request.json()
  if (!tripId || !groupSize || groupSize < 1 || groupSize > 50) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Only the trip creator can change group size
  const { data: trip } = await supabase
    .from('trips')
    .select('creator_id')
    .eq('id', tripId)
    .single()

  if (!trip || trip.creator_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { error } = await supabase
    .from('trips')
    .update({ group_size: groupSize })
    .eq('id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

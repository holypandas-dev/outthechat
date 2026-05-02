import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await request.json()
  if (!tripId) return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })

  // Verify user is the trip creator
  const { data: trip } = await supabase
    .from('trips')
    .select('creator_id')
    .eq('id', tripId)
    .single()

  if (!trip || trip.creator_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use admin client to bypass RLS for cascading child deletes
  const admin = createAdminClient()
  await admin.from('votes').delete().eq('trip_id', tripId)
  await admin.from('comments').delete().eq('trip_id', tripId)
  await admin.from('activities').delete().eq('trip_id', tripId)
  await admin.from('days').delete().eq('trip_id', tripId)
  await admin.from('fund_contributions').delete().eq('trip_id', tripId)
  await admin.from('invite_links').delete().eq('trip_id', tripId)
  await admin.from('trip_members').delete().eq('trip_id', tripId)

  const { error } = await admin.from('trips').delete().eq('id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

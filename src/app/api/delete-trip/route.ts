import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

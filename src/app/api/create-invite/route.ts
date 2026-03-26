import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId } = await request.json()

    // Verify user is the organizer
    const { data: trip } = await supabase
      .from('trips')
      .select('id, title, creator_id')
      .eq('id', tripId)
      .single()

    if (!trip || trip.creator_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if an invite link already exists for this trip
    const { data: existing } = await supabase
      .from('invite_links')
      .select('token')
      .eq('trip_id', tripId)
      .eq('created_by', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ token: existing.token })
    }

    // Create new invite link
    const { data: invite, error } = await supabase
      .from('invite_links')
      .insert({
        trip_id: tripId,
        created_by: user.id,
      })
      .select('token')
      .single()

    if (error) throw error

    return NextResponse.json({ token: invite.token })

  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
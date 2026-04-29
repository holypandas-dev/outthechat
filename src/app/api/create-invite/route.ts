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

    // Verify user is a trip member (any member can generate an invite)
    const { data: member } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if an invite link already exists for this trip
    const { data: existing } = await supabase
      .from('invite_links')
      .select('token')
      .eq('trip_id', tripId)
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
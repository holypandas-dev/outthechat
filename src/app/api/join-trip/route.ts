import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Missing invite token' }, { status: 400 })
    }

    // Verify the session server-side — never trust user_id from the client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to join a trip.' }, { status: 401 })
    }
    const user_id = user.id

    const admin = createAdminClient()

    // Look up invite link using service role (bypasses RLS)
    const { data: invite, error: inviteError } = await admin
      .from('invite_links')
      .select('*, trips(id, title)')
      .eq('token', token)
      .maybeSingle()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'This invite link is invalid or has expired.' }, { status: 404 })
    }

    const trip = invite.trips as { id: string; title: string }

    // Check if already a member
    const { data: existing } = await admin
      .from('trip_members')
      .select('id')
      .eq('trip_id', trip.id)
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ already_member: true, trip_id: trip.id, trip_title: trip.title })
    }

    // Add user as trip member
    const { error: joinError } = await admin
      .from('trip_members')
      .insert({
        trip_id: trip.id,
        user_id,
        role: 'member',
        interest_status: 'in',
      })

    if (joinError) {
      console.error('Join error:', joinError)
      return NextResponse.json({ error: 'Failed to join trip. Please try again.' }, { status: 500 })
    }

    // Update invite use count
    await admin
      .from('invite_links')
      .update({ use_count: (invite.use_count || 0) + 1 })
      .eq('id', invite.id)

    return NextResponse.json({ success: true, trip_id: trip.id, trip_title: trip.title })

  } catch (error) {
    console.error('Join trip error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

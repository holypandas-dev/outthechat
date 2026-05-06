import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId } = await request.json()
    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })
    }

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

    // Use admin client to bypass RLS on invite_links for both read and write
    const admin = createAdminClient()

    // Return existing link if one already exists for this trip
    const { data: existing, error: readError } = await admin
      .from('invite_links')
      .select('token')
      .eq('trip_id', tripId)
      .maybeSingle()

    if (readError) {
      console.error('create-invite read error:', readError)
      return NextResponse.json({ error: readError.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ token: existing.token })
    }

    // Generate token explicitly — don't rely on a DB default
    const token = crypto.randomUUID()

    const { data: invite, error: insertError } = await admin
      .from('invite_links')
      .insert({ trip_id: tripId, created_by: user.id, token })
      .select('token')
      .single()

    if (insertError) {
      console.error('create-invite insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ token: invite.token })

  } catch (err) {
    console.error('create-invite unexpected error:', err)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}

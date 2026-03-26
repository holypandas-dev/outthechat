import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activityId, tripId, value } = await request.json()

    // Verify user is a trip member
    const { data: member } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: 'Not a trip member' }, { status: 403 })
    }

    // Upsert vote (update if exists, insert if not)
    const { error } = await supabase
      .from('votes')
      .upsert({
        activity_id: activityId,
        trip_id: tripId,
        user_id: user.id,
        value: value, // -1, 0, or 1
      }, {
        onConflict: 'activity_id,user_id'
      })

    if (error) throw error

    // Get updated vote score
    const { data: activity } = await supabase
      .from('activities')
      .select('vote_score')
      .eq('id', activityId)
      .single()

    return NextResponse.json({ score: activity?.vote_score ?? 0 })

  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}
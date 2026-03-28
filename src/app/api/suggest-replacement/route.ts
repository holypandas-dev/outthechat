import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId, activityId, message } = await request.json()
    if (!tripId || !activityId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

    // Fetch trip and the original activity
    const [{ data: trip }, { data: activity }] = await Promise.all([
      supabase.from('trips').select('title, destination, budget_tier').eq('id', tripId).single(),
      supabase.from('activities').select('*').eq('id', activityId).single(),
    ])

    if (!trip || !activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const prompt = `You are a travel assistant for OutTheChat. Suggest a single replacement activity for a trip itinerary.

Trip: "${trip.title}" to ${trip.destination} (${trip.budget_tier} budget)
Current activity being replaced: "${activity.title}" at ${activity.location} (${activity.time_slot}, ${activity.category})
User request: "${message}"

Return ONLY a JSON object with no markdown or extra text:
{
  "title": "Activity Name",
  "description": "2-3 sentence description",
  "location": "Specific venue or area name",
  "cost_estimate": 25,
  "duration_minutes": 120,
  "category": "food",
  "map_search_query": "search term for maps",
  "insider_tip": "A useful local tip"
}

Categories must be one of: food, activity, nightlife, culture, nature, hidden_gem, hotel, transport
Be specific and authentic — avoid generic tourist traps.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content from OpenAI')

    let suggested: {
      title: string
      description: string
      location: string
      cost_estimate: number
      duration_minutes: number
      category: string
      map_search_query: string
      insider_tip: string
    }

    try {
      suggested = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Invalid JSON from OpenAI')
      suggested = JSON.parse(match[0])
    }

    // Insert as a suggestion linked to the original activity
    const { data: newActivity, error: insertError } = await supabase
      .from('activities')
      .insert({
        day_id: activity.day_id,
        trip_id: tripId,
        time_slot: activity.time_slot,
        title: suggested.title,
        description: suggested.description,
        location: suggested.location,
        cost_estimate: suggested.cost_estimate || 0,
        duration_minutes: suggested.duration_minutes || 120,
        category: suggested.category || 'activity',
        map_search_query: suggested.map_search_query || suggested.location,
        insider_tip: suggested.insider_tip || null,
        vote_score: 0,
        vote_count: 0,
        is_suggestion: true,
        suggested_by: user.id,
        parent_activity_id: activityId,
        is_confirmed: false,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ suggestion: newActivity })

  } catch (error) {
    console.error('Suggest replacement error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 })
  }
}

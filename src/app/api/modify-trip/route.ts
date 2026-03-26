import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId, message } = await request.json()
    if (!tripId || !message) {
      return NextResponse.json({ error: 'Missing tripId or message' }, { status: 400 })
    }

    // Verify user is a trip member
    const { data: membership } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this trip' }, { status: 403 })
    }

    // Fetch trip + days + activities
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const { data: days } = await supabase
      .from('days')
      .select(`*, activities (*)`)
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })

    // Build itinerary summary for the prompt
    const itinerarySummary = (days || []).map(day => {
      const activities = (day.activities as {
        id: string
        time_slot: string
        title: string
        description: string
        location: string
        cost_estimate: number
        category: string
        duration_minutes: number
        insider_tip: string
      }[]) || []

      const slots = ['morning', 'afternoon', 'evening'].map(slot => {
        const act = activities.find(a => a.time_slot === slot)
        if (!act) return `  ${slot}: (none)`
        return `  ${slot}: "${act.title}" at ${act.location} — ${act.description} [category: ${act.category}, cost: $${act.cost_estimate}, ${act.duration_minutes}min]`
      }).join('\n')

      return `Day ${day.day_number} (${day.theme || 'no theme'}):\n${slots}`
    }).join('\n\n')

    const systemPrompt = `You are an AI travel assistant for OutTheChat. You modify existing trip itineraries based on user requests.
You respond with specific, actionable changes to activities.
Always respond with valid JSON only — no markdown, no extra text.
Categories must be one of: food, activity, nightlife, culture, nature, hidden_gem, hotel, transport`

    const userPrompt = `Current trip: "${trip.title}" to ${trip.destination} (${trip.duration_days} days, ${trip.budget_tier} budget)

Current itinerary:
${itinerarySummary}

User request: "${message}"

Return ONLY a JSON object with this exact structure:
{
  "message": "Friendly 1-2 sentence confirmation of what you changed and why it fits the request",
  "changes": [
    {
      "day_number": 1,
      "time_slot": "morning",
      "action": "replace",
      "activity": {
        "title": "Activity Name",
        "description": "2-3 sentence description of this activity",
        "location": "Specific venue or area name",
        "cost_estimate": 25,
        "duration_minutes": 120,
        "category": "food",
        "map_search_query": "search term for maps",
        "insider_tip": "A useful local tip"
      }
    }
  ]
}

Rules:
- Only include days/slots that need to change
- time_slot must be "morning", "afternoon", or "evening"
- day_number must be between 1 and ${trip.duration_days}
- cost_estimate is per person in USD
- Be specific and authentic — avoid generic tourist traps
- If the request is vague (like "make it cheaper"), change 1-3 activities that best address it
- If a specific day/time is mentioned, change only that slot`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content from OpenAI')

    let result: {
      message: string
      changes: {
        day_number: number
        time_slot: string
        action: string
        activity: {
          title: string
          description: string
          location: string
          cost_estimate: number
          duration_minutes: number
          category: string
          map_search_query: string
          insider_tip: string
        }
      }[]
    }

    try {
      result = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Invalid JSON from OpenAI')
      result = JSON.parse(match[0])
    }

    // Apply changes to Supabase
    const appliedChanges: { day_number: number; time_slot: string }[] = []

    for (const change of result.changes || []) {
      const day = (days || []).find(d => d.day_number === change.day_number)
      if (!day) continue

      const activities = (day.activities as { id: string; time_slot: string }[]) || []
      const existingActivity = activities.find(a => a.time_slot === change.time_slot)

      if (existingActivity && change.action === 'replace') {
        await supabase
          .from('activities')
          .update({
            title: change.activity.title,
            description: change.activity.description,
            location: change.activity.location,
            cost_estimate: change.activity.cost_estimate || 0,
            duration_minutes: change.activity.duration_minutes || 120,
            category: change.activity.category || 'activity',
            map_search_query: change.activity.map_search_query || change.activity.location,
            insider_tip: change.activity.insider_tip || null,
          })
          .eq('id', existingActivity.id)

        appliedChanges.push({ day_number: change.day_number, time_slot: change.time_slot })
      }
    }

    return NextResponse.json({
      message: result.message,
      appliedChanges,
    })

  } catch (error) {
    console.error('Trip modification error:', error)
    return NextResponse.json({ error: 'Failed to modify trip' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, destination, days, vibe, budget, groupSize } = await request.json()

    // Build the AI prompt
    const systemPrompt = `You are OutTheChat's AI travel planner. Generate detailed, locally-authentic travel itineraries with hidden gems beyond tourist traps. Always respond with valid JSON only — no markdown, no extra text.`

    const userPrompt = `Generate a ${days}-day trip to ${destination}.
Vibe: ${vibe || 'balanced mix of culture, food, and exploration'}
Budget tier: ${budget || 'mid'}
Group size: ${groupSize || 2} people
Additional notes: ${prompt || ''}

Return ONLY a JSON object with this exact structure:
{
  "title": "catchy trip title",
  "tagline": "one line description",
  "destination": "${destination}",
  "days": [
    {
      "day_number": 1,
      "theme": "theme for the day",
      "morning": {
        "title": "activity name",
        "description": "2-3 sentence description",
        "location": "specific place name",
        "cost_estimate": 25,
        "duration_minutes": 120,
        "category": "food",
        "map_search_query": "search term for maps",
        "insider_tip": "local tip"
      },
      "afternoon": { same structure },
      "evening": { same structure }
    }
  ],
  "estimated_cost": {
    "budget": 800,
    "mid": 1500,
    "luxury": 3000,
    "currency": "USD"
  },
  "local_tips": ["tip 1", "tip 2", "tip 3"]
}

Categories must be one of: food, activity, nightlife, culture, nature, hidden_gem, hotel, transport
Generate exactly ${days} days. Make it specific, authentic, and exciting.`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content from OpenAI')

    // Parse JSON response
    let itinerary
    try {
      itinerary = JSON.parse(content)
    } catch {
      // Try to extract JSON if wrapped in markdown
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Invalid JSON from OpenAI')
      itinerary = JSON.parse(match[0])
    }

    // Save trip to Supabase
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        creator_id: user.id,
        title: itinerary.title,
        destination: destination,
        destination_city: destination,
        vibe_preset: vibe || null,
        duration_days: parseInt(days),
        budget_tier: budget || 'mid',
        group_size: parseInt(groupSize) || 2,
        ai_prompt: prompt,
        local_tips: itinerary.local_tips || [],
        estimated_cost: itinerary.estimated_cost || {},
        commitment_state: {
          itinerary_created: true,
          friends_joined: false,
          votes_submitted: false,
          fund_started: false,
          half_funded: false,
          flights_booked: false,
          hotel_booked: false,
          all_confirmed: false,
        },
        commitment_score: 10,
        status: 'planning',
      })
      .select()
      .single()

    if (tripError) throw tripError

    // Save days and activities
    for (const day of itinerary.days) {
      const { data: dayRow, error: dayError } = await supabase
        .from('days')
        .insert({
          trip_id: trip.id,
          day_number: day.day_number,
          theme: day.theme,
        })
        .select()
        .single()

      if (dayError) throw dayError

      // Save each time slot as an activity
      const slots = ['morning', 'afternoon', 'evening'] as const
      for (const slot of slots) {
        const activity = day[slot]
        if (!activity) continue

        await supabase.from('activities').insert({
          day_id: dayRow.id,
          trip_id: trip.id,
          time_slot: slot,
          title: activity.title,
          description: activity.description,
          location: activity.location,
          cost_estimate: activity.cost_estimate || 0,
          duration_minutes: activity.duration_minutes || 120,
          category: activity.category || 'activity',
          map_search_query: activity.map_search_query || activity.location,
          insider_tip: activity.insider_tip || null,
        })
      }
    }

    // Add creator as trip member (organizer)
    await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: user.id,
      role: 'organizer',
      interest_status: 'in',
    })

    return NextResponse.json({ tripId: trip.id })

  } catch (error) {
    console.error('Trip generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate trip' },
      { status: 500 }
    )
  }
}
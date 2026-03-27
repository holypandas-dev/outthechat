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

    const { tripId } = await request.json()
    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }

    // Fetch the trip (basic columns first)
    const { data: trip, error } = await supabase
      .from('trips')
      .select('id, destination, duration_days, vibe_preset, start_date')
      .eq('id', tripId)
      .single()

    if (error || !trip) {
      console.error('Trip fetch error:', error)
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Return cached result if available (what_to_wear may not exist yet)
    const { data: cached } = await supabase
      .from('trips')
      .select('what_to_wear')
      .eq('id', tripId)
      .single()

    if (cached?.what_to_wear) {
      return NextResponse.json({ data: cached.what_to_wear })
    }

    // Build context for the prompt
    const travelMonth = trip.start_date
      ? new Date(trip.start_date).toLocaleString('en-US', { month: 'long' })
      : null

    const vibeLabels: Record<string, string> = {
      food_adventure: 'Food adventure (eating out a lot, street food, restaurant hopping)',
      luxury: 'Luxury soft life (fine dining, upscale venues, smart-casual dress)',
      backpacker: 'Backpacker (budget, outdoors, rough travel)',
      girls_trip: 'Girls trip (brunch spots, rooftop bars, going out)',
      nightlife: 'Party & nightlife (clubs, bars, dancing)',
      wellness: 'Wellness retreat (spas, yoga, nature walks)',
      culture: 'Culture & history (museums, galleries, walking tours)',
      adventure: 'Adventure (hiking, surfing, outdoor sports)',
    }

    const vibeDescription = trip.vibe_preset ? vibeLabels[trip.vibe_preset] || trip.vibe_preset : 'balanced mix of sightseeing, food, and exploration'

    const prompt = `You are a travel packing expert. Generate practical packing and outfit advice for a trip.

Destination: ${trip.destination}
Duration: ${trip.duration_days} days
${travelMonth ? `Travel month: ${travelMonth}` : ''}
Trip vibe: ${vibeDescription}

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "weather_expectations": "2-3 sentences about typical weather and conditions during this trip",
  "recommended_clothing": [
    "Specific clothing item with brief reason"
  ],
  "what_not_to_bring": [
    "Item to leave home with brief reason"
  ],
  "packing_checklist": {
    "essentials": ["item1", "item2"],
    "clothing": ["item1", "item2"],
    "toiletries": ["item1", "item2"],
    "accessories": ["item1", "item2"]
  }
}

Rules:
- recommended_clothing: 5-8 specific items tailored to the vibe and weather
- what_not_to_bring: 3-5 common overpacking mistakes for this destination/vibe
- packing_checklist.essentials: 4-6 must-haves (passport, adapters, etc.)
- packing_checklist.clothing: 6-10 specific pieces for ${trip.duration_days} days
- packing_checklist.toiletries: 4-6 items, note if easy to buy locally
- packing_checklist.accessories: 3-5 items for this vibe
Be specific and opinionated — no generic advice.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a travel packing expert. Always respond with valid JSON only — no markdown, no extra text.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content from OpenAI')

    let data
    try {
      data = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Invalid JSON from OpenAI')
      data = JSON.parse(match[0])
    }

    // Cache in trips table (ignore error if column doesn't exist yet)
    const { error: updateError } = await supabase
      .from('trips')
      .update({ what_to_wear: data })
      .eq('id', tripId)

    if (updateError) {
      console.warn('Could not cache what_to_wear (column may not exist):', updateError.message)
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('What to wear generation error:', error)
    return NextResponse.json({ error: 'Failed to generate packing advice' }, { status: 500 })
  }
}

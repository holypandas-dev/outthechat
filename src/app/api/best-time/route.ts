import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const destination = searchParams.get('destination')?.trim()

  if (!destination || destination.length < 2) {
    return NextResponse.json({ hint: '' })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `In one sentence (under 25 words), what is the best time of year to visit ${destination}? Mention the months and briefly say why.`,
      }],
      max_tokens: 60,
      temperature: 0.3,
    })

    const hint = completion.choices[0]?.message?.content?.trim() || ''
    return NextResponse.json({ hint })
  } catch {
    return NextResponse.json({ hint: '' })
  }
}

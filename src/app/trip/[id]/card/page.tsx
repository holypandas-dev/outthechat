import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CopyLinkButtonCard } from '@/components/CopyLinkButtonCard'

async function fetchDestinationPhoto(destination: string): Promise<string | null> {
  const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const query = encodeURIComponent(destination)
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&client_id=${key}`,
      { next: { revalidate: 86400 } }
    )
    const data = await res.json()
    return data.results?.[0]?.urls?.regular ?? null
  } catch {
    return null
  }
}

const vibeLabels: Record<string, string> = {
  food_adventure: '🍜 Food adventure',
  luxury: '✨ Luxury soft life',
  backpacker: '🎒 Backpacker',
  girls_trip: '💅 Girls trip',
  nightlife: '🎉 Party & nightlife',
  wellness: '🧘 Wellness retreat',
  cultural: '🏛 Cultural deep dive',
  adventure: '🏔 Adventure',
}

export default async function TripCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !trip) redirect('/dashboard')

  const { data: days } = await supabase
    .from('days')
    .select(`*, activities (*)`)
    .eq('trip_id', id)
    .order('day_number', { ascending: true })

  const { data: members } = await supabase
    .from('trip_members')
    .select(`*, profiles (display_name, avatar_url)`)
    .eq('trip_id', id)

  const destinationPhoto = await fetchDestinationPhoto(trip.destination)

  // Flatten all activities and sort by vote_score desc to get top highlights
  const allActivities = (days ?? []).flatMap((d: { activities?: { id: string; title: string; category: string; vote_score: number }[] }) => d.activities ?? [])
  const topActivities = [...allActivities]
    .sort((a, b) => (b.vote_score ?? 0) - (a.vote_score ?? 0))
    .slice(0, 4)

  const estimatedCost = trip.estimated_cost
    ? (trip.estimated_cost as Record<string, number>)[trip.budget_tier]
    : null

  const avatarColors = ['#C4563A', '#5b8bd4', '#6bbf8e', '#c47bd4', '#e8a23a']

  const commitmentColor =
    trip.commitment_score >= 91 ? '#4ade80'
    : trip.commitment_score >= 76 ? '#C4563A'
    : trip.commitment_score >= 51 ? '#fbbf24'
    : trip.commitment_score >= 26 ? '#60a5fa'
    : '#b8b0a2'

  const categoryEmoji: Record<string, string> = {
    food: '🍽',
    activity: '🎯',
    nightlife: '🌙',
    culture: '🏛',
    nature: '🌿',
    hidden_gem: '💎',
    hotel: '🏨',
    transport: '🚌',
  }

  const vibeLabel = trip.vibe_preset ? (vibeLabels[trip.vibe_preset] ?? trip.vibe_preset) : null

  return (
    <div className="min-h-screen bg-[#050504] flex flex-col items-center justify-start py-6 sm:py-10 px-0 sm:px-4 overflow-x-hidden">

      {/* Back link + copy button */}
      <div className="w-full max-w-[390px] mb-4 flex items-center justify-between px-4 sm:px-0">
        <Link
          href={`/trip/${id}`}
          className="text-sm text-[#b8b0a2] hover:text-[#f5efe6] transition-colors font-mono"
        >
          ← Back to trip
        </Link>
        <CopyLinkButtonCard tripId={id} />
      </div>

      {/* Card — 390×844, screenshot-ready */}
      <div
        id="trip-card"
        className="relative overflow-hidden flex flex-col w-full"
        style={{
          maxWidth: 390,
          minHeight: 844,
          background: 'linear-gradient(160deg, #111110 0%, #0f0d0b 40%, #0d0c0a 100%)',
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(242,237,228,0.07)',
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >

        {/* Destination photo background */}
        {destinationPhoto && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={destinationPhoto}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.18,
              }}
            />
            {/* Dark overlay so text stays readable */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(5,5,4,0.55) 0%, rgba(5,5,4,0.82) 45%, rgba(5,5,4,0.97) 100%)',
              }}
            />
          </div>
        )}

        {/* Watermark destination text */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          style={{ zIndex: 0 }}
        >
          <span
            style={{
              fontSize: 'clamp(72px, 18vw, 110px)',
              fontWeight: 900,
              color: 'rgba(196,86,58,0.05)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              userSelect: 'none',
              transform: 'rotate(-15deg) translateY(-30px)',
              maxWidth: '140%',
            }}
          >
            {trip.destination}
          </span>
        </div>

        {/* Subtle top gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: 200,
            background: 'linear-gradient(180deg, rgba(196,86,58,0.10) 0%, transparent 100%)',
            zIndex: 1,
          }}
        />

        {/* Orange top bar */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: 3, background: '#C4563A', zIndex: 2 }}
        />

        {/* Content */}
        <div className="relative flex flex-col h-full px-8 pt-10 pb-8" style={{ zIndex: 2 }}>

          {/* Header — destination */}
          <div className="mb-1">
            <p
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                color: '#C4563A',
                marginBottom: 10,
              }}
            >
              ✈ Trip plan
            </p>
            <h1
              style={{
                fontSize: 68,
                fontWeight: 900,
                color: '#f5efe6',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                textTransform: 'uppercase',
              }}
            >
              {trip.destination}
            </h1>
          </div>

          {/* Trip meta + vibe badge */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                color: '#b8b0a2',
                background: 'rgba(242,237,228,0.06)',
                borderRadius: 6,
                padding: '4px 10px',
                border: '1px solid rgba(242,237,228,0.08)',
              }}
            >
              {trip.duration_days} days
            </span>
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                color: '#b8b0a2',
                background: 'rgba(242,237,228,0.06)',
                borderRadius: 6,
                padding: '4px 10px',
                border: '1px solid rgba(242,237,228,0.08)',
              }}
            >
              {trip.budget_tier}
            </span>
            {vibeLabel && (
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: '#C4563A',
                  background: 'rgba(196,86,58,0.10)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  border: '1px solid rgba(196,86,58,0.22)',
                  fontWeight: 600,
                }}
              >
                {vibeLabel}
              </span>
            )}
          </div>

          {/* Trip title */}
          <div className="mt-5">
            <h2
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: 'rgba(242,237,228,0.75)',
                lineHeight: 1.4,
              }}
            >
              {trip.title}
            </h2>
          </div>

          {/* Divider */}
          <div
            className="my-6"
            style={{ height: 1, background: 'rgba(242,237,228,0.07)' }}
          />

          {/* Top activities */}
          {topActivities.length > 0 && (
            <div className="mb-6">
              <p
                className="font-mono uppercase mb-3"
                style={{ fontSize: 10, letterSpacing: '0.18em', color: '#C4563A' }}
              >
                Highlights
              </p>
              <div className="flex flex-col gap-2.5">
                {topActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center gap-3"
                    style={{
                      background: 'rgba(242,237,228,0.04)',
                      border: '1px solid rgba(242,237,228,0.07)',
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                      {categoryEmoji[act.category] ?? '📍'}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#f5efe6',
                        lineHeight: 1.3,
                      }}
                    >
                      {act.title}
                    </span>
                    {act.vote_score > 0 && (
                      <span
                        className="ml-auto font-mono flex-shrink-0"
                        style={{ fontSize: 11, color: '#C4563A' }}
                      >
                        +{act.vote_score}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div
            className="mb-6"
            style={{ height: 1, background: 'rgba(242,237,228,0.07)' }}
          />

          {/* Group members */}
          {members && members.length > 0 && (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p
                  className="font-mono uppercase mb-2"
                  style={{ fontSize: 10, letterSpacing: '0.18em', color: '#b8b0a2' }}
                >
                  The crew
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {(members as { id: string; profiles: { display_name: string } | null }[])
                      .slice(0, 6)
                      .map((m, i) => (
                        <div
                          key={m.id}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            border: '2px solid #0f0d0b',
                            background: avatarColors[i % 5],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'white',
                            flexShrink: 0,
                          }}
                        >
                          {m.profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      ))}
                  </div>
                  <span style={{ fontSize: 12, color: '#b8b0a2', marginLeft: 6 }}>
                    {members.length} {members.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </div>

              {/* Cost per person */}
              {estimatedCost && (
                <div className="text-right">
                  <p
                    className="font-mono uppercase mb-1"
                    style={{ fontSize: 10, letterSpacing: '0.18em', color: '#b8b0a2' }}
                  >
                    Est. cost
                  </p>
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#f5efe6',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ~${estimatedCost.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: '#b8b0a2' }}>per person</p>
                </div>
              )}
            </div>
          )}

          {/* Commitment score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p
                className="font-mono uppercase"
                style={{ fontSize: 10, letterSpacing: '0.18em', color: '#b8b0a2' }}
              >
                Commitment
              </p>
              <span
                className="font-mono"
                style={{ fontSize: 13, fontWeight: 700, color: commitmentColor }}
              >
                {trip.commitment_score ?? 0}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'rgba(242,237,228,0.08)',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${trip.commitment_score ?? 0}%`,
                  background: `linear-gradient(90deg, #C4563A, ${commitmentColor})`,
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Branding footer */}
          <div
            style={{
              borderTop: '1px solid rgba(242,237,228,0.10)',
              paddingTop: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p
                className="font-mono"
                style={{ fontSize: 15, fontWeight: 700, color: '#f5efe6', marginBottom: 3, letterSpacing: '-0.01em' }}
              >
                Planned on{' '}
                <span style={{ color: '#C4563A' }}>OutTheChat</span>
              </p>
              <p
                className="font-mono"
                style={{ fontSize: 11, color: 'rgba(184,176,162,0.7)', letterSpacing: '0.05em' }}
              >
                outthechat.vercel.app
              </p>
            </div>

            {/* Mini logo mark */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#C4563A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(196,86,58,0.35)',
              }}
            >
              <span
                className="font-mono"
                style={{ fontSize: 15, fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}
              >
                OC
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Hint below card */}
      <p className="mt-6 text-xs text-[#b8b0a2] font-mono text-center max-w-[390px] px-4 sm:px-0">
        Screenshot this card to share on Instagram Stories or TikTok
      </p>

    </div>
  )
}

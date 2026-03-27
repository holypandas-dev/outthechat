import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  // Flatten all activities and sort by vote_score desc to get top highlights
  const allActivities = (days ?? []).flatMap((d: { activities?: { id: string; title: string; category: string; vote_score: number }[] }) => d.activities ?? [])
  const topActivities = [...allActivities]
    .sort((a, b) => (b.vote_score ?? 0) - (a.vote_score ?? 0))
    .slice(0, 4)

  const estimatedCost = trip.estimated_cost
    ? (trip.estimated_cost as Record<string, number>)[trip.budget_tier]
    : null

  const avatarColors = ['#e8623a', '#5b8bd4', '#6bbf8e', '#c47bd4', '#e8a23a']

  const commitmentColor =
    trip.commitment_score >= 91 ? '#4ade80'
    : trip.commitment_score >= 76 ? '#e8623a'
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

  return (
    <div className="min-h-screen bg-[#050504] flex flex-col items-center justify-start py-10 px-4">

      {/* Back link */}
      <div className="w-full max-w-[390px] mb-4 flex items-center justify-between">
        <Link
          href={`/trip/${id}`}
          className="text-sm text-[#b8b0a2] hover:text-[#f2ede4] transition-colors font-mono"
        >
          ← Back to trip
        </Link>
        <span className="text-xs text-[#b8b0a2] font-mono uppercase tracking-widest">
          Share card
        </span>
      </div>

      {/* Card — 390×844 fixed, screenshot-ready */}
      <div
        id="trip-card"
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 390,
          minHeight: 844,
          background: 'linear-gradient(160deg, #111110 0%, #0a0a09 40%, #0d0c0a 100%)',
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(242,237,228,0.07)',
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >

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
              color: 'rgba(232,98,58,0.06)',
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
            background: 'linear-gradient(180deg, rgba(232,98,58,0.12) 0%, transparent 100%)',
            zIndex: 1,
          }}
        />

        {/* Orange top bar */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: 3, background: '#e8623a', zIndex: 2 }}
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
                color: '#e8623a',
                marginBottom: 10,
              }}
            >
              ✈ Trip plan
            </p>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: '#f2ede4',
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
              }}
            >
              {trip.destination}
            </h1>
          </div>

          {/* Trip meta */}
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
                style={{ fontSize: 10, letterSpacing: '0.18em', color: '#e8623a' }}
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
                        color: '#f2ede4',
                        lineHeight: 1.3,
                      }}
                    >
                      {act.title}
                    </span>
                    {act.vote_score > 0 && (
                      <span
                        className="ml-auto font-mono flex-shrink-0"
                        style={{ fontSize: 11, color: '#e8623a' }}
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
                            border: '2px solid #0a0a09',
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
                      color: '#f2ede4',
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
                  background: `linear-gradient(90deg, #e8623a, ${commitmentColor})`,
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
              borderTop: '1px solid rgba(242,237,228,0.07)',
              paddingTop: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p
                className="font-mono"
                style={{ fontSize: 12, color: '#b8b0a2', marginBottom: 2 }}
              >
                Planned on{' '}
                <span style={{ color: '#e8623a', fontWeight: 600 }}>OutTheChat</span>
              </p>
              <p
                className="font-mono"
                style={{ fontSize: 10, color: 'rgba(184,176,162,0.5)', letterSpacing: '0.05em' }}
              >
                outthechat.vercel.app
              </p>
            </div>

            {/* Mini logo mark */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#e8623a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="font-mono"
                style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}
              >
                OC
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Hint below card */}
      <p className="mt-6 text-xs text-[#b8b0a2] font-mono text-center max-w-[390px]">
        Screenshot this card to share on Instagram Stories or TikTok
      </p>

    </div>
  )
}

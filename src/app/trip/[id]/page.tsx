import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { InviteButton } from '@/components/InviteButton'
import { SendNudgesButton } from '@/components/SendNudgesButton'
import { DeleteTripButton } from '@/components/DeleteTripButton'
import { TripAIChat } from '@/components/TripAIChat'
import { TripGroupChat } from '@/components/TripGroupChat'
import { TripChatNavButton } from '@/components/TripChatNavButton'
import { ItinerarySection } from '@/components/ItinerarySection'
import { WhatToWear } from '@/components/WhatToWear'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Get user's existing votes for this trip
  const { data: userVotes } = await supabase
    .from('votes')
    .select('activity_id, value')
    .eq('trip_id', id)
    .eq('user_id', user.id)

  const voteMap = Object.fromEntries(
    (userVotes || []).map(v => [v.activity_id, v.value])
  )

  // Fetch suggestions (activities that are suggestions, keyed by parent_activity_id)
  const { data: suggestions } = await supabase
    .from('activities')
    .select('*')
    .eq('trip_id', id)
    .eq('is_suggestion', true)
    .order('created_at', { ascending: true })

  type SuggestionActivity = NonNullable<typeof suggestions>[number]
  const suggestionsMap = (suggestions || []).reduce((acc, s) => {
    if (s.parent_activity_id) {
      acc[s.parent_activity_id] = [...(acc[s.parent_activity_id] || []), s]
    }
    return acc
  }, {} as Record<string, SuggestionActivity[]>)

  const memberProfiles = (members || []).map(m => ({
    user_id: m.user_id,
    display_name: (m.profiles as { display_name: string } | null)?.display_name || null,
  }))


  const commitmentLabel = (score: number) => {
    if (score >= 91) return { text: 'Locked in', colorStyle: { color: '#16a34a' } }
    if (score >= 76) return { text: 'This is happening', colorStyle: { color: 'var(--accent)' } }
    if (score >= 51) return { text: 'Getting real', colorStyle: { color: '#d97706' } }
    if (score >= 26) return { text: 'Planning mode', colorStyle: { color: '#2563eb' } }
    return { text: 'Just dreaming', colorStyle: { color: 'var(--text-secondary)' } }
  }

  const commitment = commitmentLabel(trip.commitment_score || 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Nav */}
      <nav
        className="px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--background)' }}
      >
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-fraunces)', fontSize: '15px' }}>
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <TripChatNavButton />
          <ThemeToggle />
          <Link href="/plan" className="hidden sm:inline text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            + New trip
          </Link>
          <Link href="/dashboard" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">← Back</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Trip header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
                {trip.duration_days} days · {trip.destination} · {trip.budget_tier}
              </p>
              <h1 className="text-3xl font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {trip.title}
              </h1>
              <div className="mt-4 w-full sm:max-w-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium" style={commitment.colorStyle}>
                    {commitment.text}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {trip.commitment_score}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ background: 'var(--accent)', width: `${trip.commitment_score}%` }}
                  />
                </div>
              </div>
            </div>

            {members && members.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((m, i) => (
                    <div
                      key={m.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{ outline: '2px solid var(--background)', color: 'white' }}
                      style={{ background: ['var(--accent)', '#5b8bd4', '#6bbf8e', '#c47bd4', '#e8a23a'][i % 5] }}
                    >
                      {(m.profiles as { display_name: string })?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {members.length} {members.length === 1 ? 'person' : 'people'}
                </span>
              </div>
            )}
          </div>

          {trip.estimated_cost && Object.keys(trip.estimated_cost).length > 0 && (
            <div className="mt-6 flex gap-3 flex-wrap">
              {['budget', 'mid', 'luxury'].map(tier => {
                const cost = (trip.estimated_cost as Record<string, number>)[tier]
                if (!cost) return null
                return (
                  <div
                    key={tier}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{
                      border: trip.budget_tier === tier ? '1px solid var(--accent)' : '0.5px solid var(--border)',
                      background: trip.budget_tier === tier ? 'var(--accent-muted)' : 'transparent',
                      color: trip.budget_tier === tier ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <span className="capitalize">{tier}</span>
                    <span className="ml-2 font-mono">~${cost.toLocaleString()}/person</span>
                  </div>
                )
              })}
            </div>
          )}

          {trip.local_tips && (trip.local_tips as string[]).length > 0 && (
            <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
                Local tips
              </p>
              <ul className="space-y-1.5">
                {(trip.local_tips as string[]).map((tip, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex-shrink-0" style={{ color: 'var(--accent)' }}>→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* What to wear */}
        <div className="mb-6">
          <WhatToWear
            tripId={id}
            initialData={trip.what_to_wear ?? null}
          />
        </div>

        {/* Days */}
        <ItinerarySection
          days={(days ?? []) as Parameters<typeof ItinerarySection>[0]['days']}
          voteMap={voteMap}
          tripId={id}
          destination={trip.destination}
          memberCount={members?.length ?? 1}
          currentUserId={user.id}
          memberProfiles={memberProfiles}
          initialSuggestionsMap={suggestionsMap as Parameters<typeof ItinerarySection>[0]['initialSuggestionsMap']}
        />

        {/* Actions */}
        <div className="mt-12 pt-8" style={{ borderTop: '0.5px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              {trip.creator_id === user.id && <SendNudgesButton tripId={id} />}
              <Link
                href={`/trip/${id}/fund`}
                className="text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Group fund
              </Link>
              <Link
                href={`/trip/${id}/card`}
                className="text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Share card
              </Link>
            </div>
            <InviteButton tripId={id} />
          </div>

          <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5">
              <Link
                href="/dashboard"
                className="text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                ← Dashboard
              </Link>
              <Link
                href="/plan"
                className="text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                New trip
              </Link>
            </div>
            {trip.creator_id === user.id && (
              <DeleteTripButton tripId={id} variant="action" />
            )}
          </div>
        </div>

      </main>

      <TripAIChat tripId={id} />
      <TripGroupChat
        tripId={id}
        currentUserId={user.id}
        memberProfiles={(members || []).map(m => ({
          user_id: m.user_id,
          display_name: (m.profiles as { display_name: string } | null)?.display_name || null,
        }))}
      />
    </div>
  )
}
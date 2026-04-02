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
    if (score >= 91) return { text: 'Locked in 🔒', colorClass: 'text-green-400', colorStyle: undefined }
    if (score >= 76) return { text: 'This is happening ✈️', colorClass: '', colorStyle: { color: 'var(--accent)' } }
    if (score >= 51) return { text: 'Getting real 🔥', colorClass: 'text-amber-400', colorStyle: undefined }
    if (score >= 26) return { text: 'Planning mode 📋', colorClass: 'text-blue-400', colorStyle: undefined }
    return { text: 'Just dreaming 💭', colorClass: '', colorStyle: { color: 'var(--text-secondary)' } }
  }

  const commitment = commitmentLabel(trip.commitment_score || 0)

  return (
    <div className="min-h-screen bg-[#0f0d0b]">

      {/* Nav */}
      <nav className="border-b border-[rgba(242,237,228,0.08)] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0f0d0b] z-10">
        <Link href="/dashboard" className="font-mono text-sm">
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <TripChatNavButton />
          <Link href="/plan" className="hidden sm:inline text-sm hover:text-text-primary transition-colors" style={{ color: 'var(--text-secondary)' }}>
            + New trip
          </Link>
          <Link href="/dashboard" className="text-sm hover:text-text-primary transition-colors" style={{ color: 'var(--text-secondary)' }}>
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
                  <span className={`text-sm font-medium ${commitment.colorClass}`} style={commitment.colorStyle}>
                    {commitment.text}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {trip.commitment_score}%
                  </span>
                </div>
                <div className="h-1.5 bg-[rgba(242,237,228,0.06)] rounded-full overflow-hidden">
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
                      className="w-8 h-8 rounded-full border-2 border-[#0f0d0b] flex items-center justify-center text-xs font-medium text-white"
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
                    className={`px-4 py-2 rounded-lg border text-sm ${
                      trip.budget_tier === tier
                        ? 'border-accent bg-[rgba(196,86,58,0.08)]'
                        : 'border-[rgba(242,237,228,0.08)]'
                    }`}
                    style={trip.budget_tier === tier ? { color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
                  >
                    <span className="capitalize">{tier}</span>
                    <span className="ml-2 font-mono">~${cost.toLocaleString()}/person</span>
                  </div>
                )
              })}
            </div>
          )}

          {trip.local_tips && (trip.local_tips as string[]).length > 0 && (
            <div className="mt-6 bg-[#1a1612] border border-[rgba(242,237,228,0.08)] rounded-xl p-4">
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
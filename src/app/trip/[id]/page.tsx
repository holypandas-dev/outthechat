import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { InviteButton } from '@/components/InviteButton'
import { SendNudgesButton } from '@/components/SendNudgesButton'
import { TripAIChat } from '@/components/TripAIChat'
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

  const commitmentLabel = (score: number) => {
    if (score >= 91) return { text: 'Locked in 🔒', color: 'text-green-400' }
    if (score >= 76) return { text: 'This is happening ✈️', color: 'text-[#e8623a]' }
    if (score >= 51) return { text: 'Getting real 🔥', color: 'text-amber-400' }
    if (score >= 26) return { text: 'Planning mode 📋', color: 'text-blue-400' }
    return { text: 'Just dreaming 💭', color: 'text-[#b8b0a2]' }
  }

  const commitment = commitmentLabel(trip.commitment_score || 0)

  return (
    <div className="min-h-screen bg-[#0a0a09]">

      {/* Nav */}
      <nav className="border-b border-[rgba(242,237,228,0.08)] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a09] z-10">
        <Link href="/dashboard" className="font-mono text-sm">
          <span className="text-[#e8623a]">Out</span>
          <span className="text-[#f2ede4]">TheChat</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/plan" className="text-sm text-[#b8b0a2] hover:text-[#f2ede4] transition-colors">
            + New trip
          </Link>
          <Link href="/dashboard" className="text-sm text-[#b8b0a2] hover:text-[#f2ede4] transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Trip header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[11px] text-[#e8623a] uppercase tracking-widest mb-2">
                {trip.duration_days} days · {trip.destination} · {trip.budget_tier}
              </p>
              <h1 className="text-3xl font-semibold text-[#f2ede4] leading-tight">
                {trip.title}
              </h1>
              <div className="mt-4 max-w-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-sm font-medium ${commitment.color}`}>
                    {commitment.text}
                  </span>
                  <span className="text-xs text-[#b8b0a2] font-mono">
                    {trip.commitment_score}%
                  </span>
                </div>
                <div className="h-1.5 bg-[rgba(242,237,228,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#e8623a] rounded-full transition-all duration-500"
                    style={{ width: `${trip.commitment_score}%` }}
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
                      className="w-8 h-8 rounded-full border-2 border-[#0a0a09] flex items-center justify-center text-xs font-medium text-white"
                      style={{ background: ['#e8623a', '#5b8bd4', '#6bbf8e', '#c47bd4', '#e8a23a'][i % 5] }}
                    >
                      {(m.profiles as { display_name: string })?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-[#b8b0a2]">
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
                        ? 'border-[#e8623a] bg-[rgba(232,98,58,0.08)] text-[#f2ede4]'
                        : 'border-[rgba(242,237,228,0.08)] text-[#b8b0a2]'
                    }`}
                  >
                    <span className="capitalize">{tier}</span>
                    <span className="ml-2 font-mono">~${cost.toLocaleString()}/person</span>
                  </div>
                )
              })}
            </div>
          )}

          {trip.local_tips && (trip.local_tips as string[]).length > 0 && (
            <div className="mt-6 bg-[#141412] border border-[rgba(242,237,228,0.08)] rounded-xl p-4">
              <p className="text-xs font-mono text-[#e8623a] uppercase tracking-widest mb-3">
                Local tips
              </p>
              <ul className="space-y-1.5">
                {(trip.local_tips as string[]).map((tip, i) => (
                  <li key={i} className="text-sm text-[#b8b0a2] flex gap-2">
                    <span className="text-[#e8623a] flex-shrink-0">→</span>
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
        />

        {/* Bottom actions */}
        <div className="mt-12 pt-8 border-t border-[rgba(242,237,228,0.08)] flex gap-3 flex-wrap">
          <InviteButton tripId={id} />
          {trip.creator_id === user.id && <SendNudgesButton tripId={id} />}
          <Link
            href={`/trip/${id}/fund`}
            className="border border-[#e8623a] text-[#e8623a] hover:bg-[rgba(232,98,58,0.08)] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            💰 Group fund
          </Link>
          <Link
            href={`/trip/${id}/card`}
            className="border border-[rgba(242,237,228,0.15)] text-[#f2ede4] hover:border-[#e8623a] hover:text-[#e8623a] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            🪄 Share card
          </Link>
          <Link
            href="/plan"
            className="bg-[#e8623a] hover:bg-[#c44d28] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Generate another trip
          </Link>
          <Link
            href="/dashboard"
            className="border border-[rgba(242,237,228,0.1)] text-[#b8b0a2] hover:text-[#f2ede4] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Back to dashboard
          </Link>
        </div>

      </main>

      <TripAIChat tripId={id} />
    </div>
  )
}
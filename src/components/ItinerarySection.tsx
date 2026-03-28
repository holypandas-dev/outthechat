'use client'

import { useState, useEffect } from 'react'
import { VoteButtons } from './VoteButtons'
import { TripMapView, type ActivityPin } from './TripMapView'

interface Activity {
  id: string
  time_slot: string
  title: string
  description: string
  location: string
  cost_estimate: number
  category: string
  insider_tip: string
  duration_minutes: number
  vote_score: number
  vote_count: number
  is_suggestion: boolean
  suggested_by: string | null
  parent_activity_id: string | null
  is_confirmed: boolean
}

interface Day {
  id: string
  day_number: number
  theme: string
  activities: Activity[]
}

interface MemberProfile {
  user_id: string
  display_name: string | null
}

interface ItinerarySectionProps {
  days: Day[]
  voteMap: Record<string, number>
  tripId: string
  destination: string
  memberCount: number
  currentUserId: string
  memberProfiles: MemberProfile[]
  initialSuggestionsMap: Record<string, Activity[]>
}

const categoryEmoji: Record<string, string> = {
  food: '🍜',
  activity: '🎯',
  nightlife: '🎉',
  culture: '🏛️',
  nature: '🌿',
  hidden_gem: '💎',
  hotel: '🏨',
  transport: '🚗',
}

export function ItinerarySection({
  days,
  voteMap,
  tripId,
  destination,
  memberCount,
  currentUserId,
  memberProfiles,
  initialSuggestionsMap,
}: ItinerarySectionProps) {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [finalizedView, setFinalizedView] = useState(false)
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({})
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  // Live score/voteCount tracking (updated by VoteButtons callbacks)
  const [liveScores, setLiveScores] = useState<Record<string, number>>({})
  const [liveVoteCounts, setLiveVoteCounts] = useState<Record<string, number>>({})

  // Suggestions state (server-seeded, extended by client-side suggestions)
  const [suggestionsMap, setSuggestionsMap] = useState<Record<string, Activity[]>>(initialSuggestionsMap)
  const [suggestFormOpen, setSuggestFormOpen] = useState<string | null>(null) // activityId
  const [suggestMessage, setSuggestMessage] = useState('')
  const [suggestLoading, setSuggestLoading] = useState(false)

  function getScore(activity: Activity) {
    return liveScores[activity.id] ?? activity.vote_score ?? 0
  }

  function getVoteCount(activity: Activity) {
    return liveVoteCounts[activity.id] ?? activity.vote_count ?? 0
  }

  function handleScoreChange(activityId: string, score: number, voteCount: number) {
    setLiveScores(prev => ({ ...prev, [activityId]: score }))
    setLiveVoteCounts(prev => ({ ...prev, [activityId]: voteCount }))
  }

  function getDisplayName(userId: string | null) {
    if (!userId) return 'a member'
    return memberProfiles.find(p => p.user_id === userId)?.display_name || 'a member'
  }

  // Voting outcome logic: show indicator once >= 50% of members have voted
  const votingThreshold = Math.max(1, Math.ceil(memberCount * 0.5))

  function getVoteOutcome(activity: Activity) {
    const score = getScore(activity)
    const count = getVoteCount(activity)
    if (count < votingThreshold) return null
    if (score >= 1) return 'favorite'
    if (score <= -1) return 'replace'
    return null
  }

  // Finalized counts
  const allActivities = days.flatMap(d => (d.activities || []).filter(a => !a.is_suggestion))
  const finalizedCount = allActivities.filter(a => getScore(a) >= 1 || a.is_confirmed).length

  async function handleSuggestReplacement(activityId: string) {
    if (!suggestMessage.trim()) return
    setSuggestLoading(true)

    try {
      const res = await fetch('/api/suggest-replacement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, activityId, message: suggestMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuggestionsMap(prev => ({
        ...prev,
        [activityId]: [...(prev[activityId] || []), data.suggestion],
      }))
      setSuggestFormOpen(null)
      setSuggestMessage('')
    } catch (err) {
      console.error('Suggestion error:', err)
    }

    setSuggestLoading(false)
  }

  function handleActivityClick(activityId: string) {
    setView('list')
    setFinalizedView(false)
    setHighlightedId(activityId)
    setTimeout(() => {
      document.getElementById(`activity-${activityId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setHighlightedId(null), 1800)
    }, 50)
  }

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
    if (!key) return

    const allActivitiesForPhotos = days.flatMap(d => d.activities || [])
    allActivitiesForPhotos.forEach(async (activity) => {
      try {
        const query = encodeURIComponent(`${activity.title} ${activity.location}`)
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${query}&per_page=1&client_id=${key}`
        )
        const data = await res.json()
        let url = data.results?.[0]?.urls?.small
        if (!url) {
          const fallbackQuery = encodeURIComponent(destination)
          const fallbackRes = await fetch(
            `https://api.unsplash.com/search/photos?query=${fallbackQuery}&per_page=1&client_id=${key}`
          )
          const fallbackData = await fallbackRes.json()
          url = fallbackData.results?.[0]?.urls?.small
        }
        if (url) setPhotoMap(prev => ({ ...prev, [activity.id]: url }))
      } catch {
        // skip failed photo fetch
      }
    })
  }, [days])

  const mapActivities: ActivityPin[] = days.flatMap(day =>
    (day.activities || [])
      .filter(a => a.location && !a.is_suggestion)
      .map(a => ({
        id: a.id,
        title: a.title,
        time_slot: a.time_slot,
        location: a.location,
        day_number: day.day_number,
        category: a.category,
      }))
  )

  function renderActivityCard(activity: Activity, dayNumber?: number, slot?: string, isSuggestion = false) {
    const outcome = getVoteOutcome(activity)
    const suggestions = suggestionsMap[activity.id] || []
    const showSuggestForm = suggestFormOpen === activity.id

    let borderClass = 'border-[rgba(242,237,228,0.06)]'
    if (highlightedId === activity.id) borderClass = 'border-[#e8623a] activity-highlight'
    else if (outcome === 'favorite') borderClass = 'border-green-600/50'
    else if (outcome === 'replace') borderClass = 'border-red-600/50'

    return (
      <div key={activity.id} className="space-y-2">
        <div
          id={`activity-${activity.id}`}
          className={`bg-[#141412] border rounded-xl p-4 hover:border-[rgba(232,98,58,0.2)] transition-colors ${borderClass}`}
        >
          {/* Vote outcome badge */}
          {outcome === 'favorite' && (
            <div className="flex items-center gap-1.5 mb-3 text-green-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              ✓ Group favorite
            </div>
          )}
          {outcome === 'replace' && (
            <div className="flex items-center gap-1.5 mb-3 text-red-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              👎 Needs replacing
            </div>
          )}

          {/* Suggestion attribution */}
          {isSuggestion && (
            <div className="flex items-center gap-1.5 mb-3 text-[#e8623a] text-xs">
              💡 Suggested by {getDisplayName(activity.suggested_by)}
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {slot && (
                  <span className="text-[10px] font-mono text-[#b8b0a2] uppercase tracking-widest">
                    {slot}
                  </span>
                )}
                <span className="text-[10px] font-mono text-[#e8623a]">
                  {categoryEmoji[activity.category] || '📍'} {activity.category}
                </span>
              </div>
              <h3 className="text-[#f2ede4] font-medium text-sm">{activity.title}</h3>
              {activity.location && (
                <p className="text-xs text-[#b8b0a2] mt-0.5">📍 {activity.location}</p>
              )}
              {activity.description && (
                <p className="text-xs text-[#b8b0a2] mt-2 leading-relaxed">{activity.description}</p>
              )}
              {activity.insider_tip && (
                <div className="mt-2 flex gap-1.5">
                  <span className="text-[#e8623a] text-xs flex-shrink-0">💡</span>
                  <p className="text-xs text-[#b8b0a2] italic">{activity.insider_tip}</p>
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <VoteButtons
                  activityId={activity.id}
                  tripId={tripId}
                  initialScore={activity.vote_score ?? 0}
                  initialVote={voteMap[activity.id] ?? 0}
                  initialVoteCount={activity.vote_count ?? 0}
                  onScoreChange={(score, voteCount) => handleScoreChange(activity.id, score, voteCount)}
                />
                {!isSuggestion && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('share-activity-to-chat', {
                      detail: { activity }
                    }))}
                    className="text-[11px] text-[#b8b0a2] hover:text-[#e8623a] transition-colors flex items-center gap-1 ml-auto"
                  >
                    💬 Share
                  </button>
                )}
                {!isSuggestion && (outcome === 'replace' || getScore(activity) <= -1) && (
                  <button
                    onClick={() => {
                      setSuggestFormOpen(showSuggestForm ? null : activity.id)
                      setSuggestMessage('')
                    }}
                    className="text-[11px] text-[#b8b0a2] hover:text-[#e8623a] transition-colors flex items-center gap-1"
                  >
                    ✏️ Suggest replacement
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {photoMap[activity.id] && (
                <img
                  src={photoMap[activity.id]}
                  alt={activity.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              {activity.cost_estimate > 0 && (
                <p className="text-sm font-mono text-[#f2ede4]">~${activity.cost_estimate}</p>
              )}
              {activity.duration_minutes > 0 && (
                <p className="text-xs text-[#b8b0a2]">
                  {activity.duration_minutes >= 60
                    ? `${Math.floor(activity.duration_minutes / 60)}h${activity.duration_minutes % 60 > 0 ? ` ${activity.duration_minutes % 60}m` : ''}`
                    : `${activity.duration_minutes}m`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Inline suggest replacement form */}
        {showSuggestForm && (
          <div className="ml-4 bg-[#141412] border border-[rgba(232,98,58,0.2)] rounded-xl p-4">
            <p className="text-xs font-mono text-[#e8623a] uppercase tracking-widest mb-3">
              ✏️ Suggest a replacement
            </p>
            <textarea
              value={suggestMessage}
              onChange={e => setSuggestMessage(e.target.value)}
              placeholder={`e.g. "suggest a better restaurant in this area" or "find a cheaper alternative"`}
              rows={2}
              className="w-full bg-[#0a0a09] border border-[rgba(242,237,228,0.1)] rounded-lg px-3 py-2 text-sm text-[#f2ede4] placeholder-[#b8b0a2] focus:outline-none focus:border-[#e8623a] resize-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => { setSuggestFormOpen(null); setSuggestMessage('') }}
                className="text-xs text-[#b8b0a2] hover:text-[#f2ede4] transition-colors px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuggestReplacement(activity.id)}
                disabled={suggestLoading || !suggestMessage.trim()}
                className="flex items-center gap-1.5 bg-[#e8623a] hover:bg-[#c44d28] disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                {suggestLoading ? (
                  <span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                Generate suggestion →
              </button>
            </div>
          </div>
        )}

        {/* Suggestions for this activity */}
        {suggestions.length > 0 && (
          <div className="ml-4 space-y-2">
            {suggestions.map(suggestion => renderActivityCard(suggestion, undefined, undefined, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* View toggle header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-mono text-[#b8b0a2] uppercase tracking-widest">
          {days.length} {days.length === 1 ? 'day' : 'days'} · {mapActivities.length} activities
        </p>
        <div className="flex items-center gap-2">
          {/* List / Map toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-[#141412] border border-[rgba(242,237,228,0.08)] rounded-lg">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'list' && !finalizedView
                  ? 'bg-[#e8623a] text-white shadow-sm'
                  : 'text-[#b8b0a2] hover:text-[#f2ede4]'
              }`}
            >
              ☰ List
            </button>
            <button
              onClick={() => { setView('map'); setFinalizedView(false) }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'map'
                  ? 'bg-[#e8623a] text-white shadow-sm'
                  : 'text-[#b8b0a2] hover:text-[#f2ede4]'
              }`}
            >
              🗺 Map
            </button>
          </div>

          {/* Finalized toggle */}
          <button
            onClick={() => { setFinalizedView(v => !v); setView('list') }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              finalizedView
                ? 'bg-green-950/60 border-green-700/50 text-green-400'
                : 'bg-[#141412] border-[rgba(242,237,228,0.08)] text-[#b8b0a2] hover:border-green-700/40 hover:text-green-400'
            }`}
          >
            Finalized ✓
          </button>
        </div>
      </div>

      {/* Finalized count bar */}
      {finalizedView && (
        <div className="mb-4 flex items-center gap-2 text-xs text-[#b8b0a2] font-mono">
          <span className="text-green-400">{finalizedCount}</span>
          <span>of {allActivities.length} activities finalized</span>
        </div>
      )}

      {/* Map view */}
      {view === 'map' && (
        <TripMapView activities={mapActivities} destination={destination} onActivityClick={handleActivityClick} />
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-8">
          {days.map(day => {
            const slots = ['morning', 'afternoon', 'evening'] as const

            // Base activities for this day (exclude suggestions — they're shown under their parent)
            const dayActivities = (day.activities || []).filter(a => !a.is_suggestion)

            // Apply finalized filter if active
            const visibleActivities = finalizedView
              ? dayActivities.filter(a => getScore(a) >= 1 || a.is_confirmed)
              : dayActivities

            if (finalizedView && visibleActivities.length === 0) return null

            return (
              <div key={day.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#e8623a] flex items-center justify-center text-xs font-mono font-medium text-white flex-shrink-0">
                    {day.day_number}
                  </div>
                  <div>
                    <h2 className="text-base font-medium text-[#f2ede4]">Day {day.day_number}</h2>
                    {day.theme && <p className="text-xs text-[#b8b0a2]">{day.theme}</p>}
                  </div>
                </div>

                <div className="space-y-3 ml-11">
                  {slots.map(slot => {
                    const activity = visibleActivities.find(a => a.time_slot === slot)
                    if (!activity) return null
                    return renderActivityCard(activity, day.day_number, slot)
                  })}
                </div>
              </div>
            )
          })}

          {finalizedView && finalizedCount === 0 && (
            <div className="text-center py-12 text-[#b8b0a2] text-sm">
              No finalized activities yet. Activities with a positive vote score or marked as confirmed will appear here.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

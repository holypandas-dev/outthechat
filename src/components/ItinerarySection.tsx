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
  currentUserId: _currentUserId,
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
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

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

    // Returns query chain from most specific → guaranteed generic fallback
    function queryChain(activity: Activity): string[] {
      const t = activity.title
      const d = destination
      switch (activity.category) {
        case 'food':
          return [`${t} food`, `restaurant food ${d}`, `restaurant food plating`, 'food dining']
        case 'nightlife':
          return [`${t} bar`, `nightlife ${d}`, 'nightlife bar cocktails', 'bar drinks']
        case 'culture':
          return [`${t}`, `museum ${d}`, 'museum interior art', 'art gallery']
        case 'nature':
          return [`${t}`, `nature ${d}`, `landscape ${d}`, 'nature scenic']
        case 'hotel':
          return [`${t} hotel`, `hotel ${d}`, 'hotel room interior', 'hotel lobby']
        case 'activity':
          return [`${t} ${d}`, `${d} attraction`, `${d} tourism`, d]
        default:
          return [`${t} ${d}`, d, 'travel destination']
      }
    }

    async function pickPhoto(queries: string[]): Promise<string | undefined> {
      for (const query of queries) {
        try {
          const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&client_id=${key}`
          )
          const data = await res.json()
          const results: { urls: { small: string } }[] = data.results ?? []
          if (results.length > 0) {
            const idx = Math.floor(Math.random() * Math.min(results.length, 3))
            return results[idx]?.urls?.small
          }
        } catch {
          // try next query
        }
      }
      return undefined
    }

    const allActivitiesForPhotos = days.flatMap(d => d.activities || [])
    allActivitiesForPhotos.forEach(async (activity) => {
      const url = await pickPhoto(queryChain(activity))
      if (url) setPhotoMap(prev => ({ ...prev, [activity.id]: url }))
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
        description: a.description,
      }))
  )

  function renderActivityCard(activity: Activity, _dayNumber?: number, slot?: string, isSuggestion = false) {
    const outcome = getVoteOutcome(activity)
    const suggestions = suggestionsMap[activity.id] || []
    const showSuggestForm = suggestFormOpen === activity.id
    const isExpanded = expandedCards[activity.id] ?? false

    const durationLabel = activity.duration_minutes > 0
      ? activity.duration_minutes >= 60
        ? `${Math.floor(activity.duration_minutes / 60)}h${activity.duration_minutes % 60 > 0 ? `${activity.duration_minutes % 60}m` : ''}`
        : `${activity.duration_minutes}m`
      : null

    let cardBorder = '0.5px solid var(--border)'
    let cardHighlight = ''
    if (highlightedId === activity.id) { cardBorder = '1px solid var(--accent)'; cardHighlight = 'activity-highlight' }
    else if (outcome === 'favorite') cardBorder = '1px solid #16a34a66'
    else if (outcome === 'replace') cardBorder = '1px solid #dc262666'

    return (
      <div key={activity.id} className="space-y-2">
        <div
          id={`activity-${activity.id}`}
          className={`rounded-xl overflow-hidden transition-colors ${cardHighlight}`}
          style={{ background: 'var(--surface)', border: cardBorder }}
        >
          {/* Photo — full width with overlaid badges */}
          {photoMap[activity.id] && (
            <div className="relative w-full h-40">
              <img
                src={photoMap[activity.id]}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)' }} />
              {/* Time slot badge */}
              {slot && (
                <span
                  className="absolute top-2.5 right-2.5 text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}
                >
                  {slot}
                </span>
              )}
              {/* Duration badge */}
              {durationLabel && (
                <span
                  className="absolute bottom-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}
                >
                  {durationLabel}
                </span>
              )}
              {/* Outcome badge on photo */}
              {outcome === 'favorite' && (
                <span className="absolute top-2.5 left-2.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500 text-white">
                  ✓ Favorite
                </span>
              )}
              {outcome === 'replace' && (
                <span className="absolute top-2.5 left-2.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500 text-white">
                  👎 Replace
                </span>
              )}
            </div>
          )}

          {/* No photo fallback banners */}
          {!photoMap[activity.id] && (
            <>
              {outcome === 'favorite' && (
                <div className="flex items-center gap-1.5 px-4 pt-3 text-green-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Group favorite
                </div>
              )}
              {outcome === 'replace' && (
                <div className="flex items-center gap-1.5 px-4 pt-3 text-red-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  Needs replacing
                </div>
              )}
            </>
          )}

          {isSuggestion && (
            <div className="flex items-center gap-1.5 px-4 pt-3 text-xs" style={{ color: 'var(--accent)' }}>
              💡 Suggested by {getDisplayName(activity.suggested_by)}
            </div>
          )}

          {/* Card body */}
          <div className="p-4">
            {/* Category pill */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
              >
                {categoryEmoji[activity.category] || '📍'} {activity.category}
              </span>
              {!photoMap[activity.id] && slot && (
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{slot}</span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-base leading-snug mb-1" style={{ color: 'var(--text-primary)' }}>
              {activity.title}
            </h3>

            {/* Location */}
            {activity.location && (
              <p className="text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                📍 {activity.location}
              </p>
            )}

            {/* Meta: cost */}
            {activity.cost_estimate > 0 && (
              <p className="text-xs font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
                ~${activity.cost_estimate}
              </p>
            )}

            {/* Expanded: description + tip + links */}
            {isExpanded && (
              <div className="mb-3 space-y-2">
                {activity.description && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {activity.description}
                  </p>
                )}
                {activity.insider_tip && (
                  <div className="flex gap-1.5">
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--accent)' }}>💡</span>
                    <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>{activity.insider_tip}</p>
                  </div>
                )}
                {!['hotel', 'transport'].includes(activity.category) && (
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(`${activity.title} ${activity.location}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] transition-opacity hover:opacity-70"
                      style={{ color: 'var(--accent)' }}
                    >
                      View on Maps →
                    </a>
                    <a
                      href={`https://www.viator.com/search/${encodeURIComponent(destination)}?pid=P00298843&mcid=42383`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] transition-opacity hover:opacity-70"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Book experiences →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Actions row */}
            <div className="flex items-center gap-3 flex-wrap">
              <VoteButtons
                activityId={activity.id}
                tripId={tripId}
                initialScore={activity.vote_score ?? 0}
                initialVote={voteMap[activity.id] ?? 0}
                initialVoteCount={activity.vote_count ?? 0}
                onScoreChange={(score, voteCount) => handleScoreChange(activity.id, score, voteCount)}
              />
              {(activity.description || activity.insider_tip) && (
                <button
                  onClick={() => setExpandedCards(prev => ({ ...prev, [activity.id]: !isExpanded }))}
                  className="text-[11px] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isExpanded ? 'Show less ↑' : 'Show more ↓'}
                </button>
              )}
              {!isSuggestion && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('share-activity-to-chat', { detail: { activity } }))}
                  className="text-[11px] transition-colors ml-auto"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  💬 Share
                </button>
              )}
              {!isSuggestion && (outcome === 'replace' || getScore(activity) <= -1) && (
                <button
                  onClick={() => { setSuggestFormOpen(showSuggestForm ? null : activity.id); setSuggestMessage('') }}
                  className="text-[11px] transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ✏️ Suggest replacement
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Suggest replacement form */}
        {showSuggestForm && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
              ✏️ Suggest a replacement
            </p>
            <textarea
              value={suggestMessage}
              onChange={e => setSuggestMessage(e.target.value)}
              placeholder={`e.g. "suggest a better restaurant in this area" or "find a cheaper alternative"`}
              rows={2}
              className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm placeholder-text-secondary focus:outline-none focus:border-accent resize-none"
              style={{ color: 'var(--text-primary)' }}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => { setSuggestFormOpen(null); setSuggestMessage('') }}
                className="text-xs px-3 py-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuggestReplacement(activity.id)}
                disabled={suggestLoading || !suggestMessage.trim()}
                className="flex items-center gap-1.5 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                {suggestLoading && <span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />}
                Generate suggestion →
              </button>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map(suggestion => renderActivityCard(suggestion, undefined, undefined, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* View toggle header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          {days.length} {days.length === 1 ? 'day' : 'days'} · {mapActivities.length} activities
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* List / Map toggle */}
          <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <button
              onClick={() => setView('list')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'list' && !finalizedView
                  ? 'text-white shadow-sm'
                  : 'hover:text-text-primary'
              }`}
              style={view === 'list' && !finalizedView ? { background: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
            >
              ☰ List
            </button>
            <button
              onClick={() => { setView('map'); setFinalizedView(false) }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'map'
                  ? 'text-white shadow-sm'
                  : 'hover:text-text-primary'
              }`}
              style={view === 'map' ? { background: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
            >
              🗺 Map
            </button>
          </div>

          {/* Finalized toggle */}
          <button
            onClick={() => { setFinalizedView(v => !v); setView('list') }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap"
            style={finalizedView
              ? { background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }
              : { background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }
            }
          >
            Finalized ✓
          </button>
        </div>
      </div>

      {/* Finalized count bar */}
      {finalizedView && (
        <div className="mb-4 flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-medium text-white flex-shrink-0" style={{ background: 'var(--accent)' }}>
                    {day.day_number}
                  </div>
                  <div>
                    <h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Day {day.day_number}</h2>
                    {day.theme && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{day.theme}</p>}
                  </div>
                </div>

                <div className="space-y-3 ml-0 sm:ml-11">
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
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No finalized activities yet. Activities with a positive vote score or marked as confirmed will appear here.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

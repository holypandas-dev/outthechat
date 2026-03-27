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
}

interface Day {
  id: string
  day_number: number
  theme: string
  activities: Activity[]
}

interface ItinerarySectionProps {
  days: Day[]
  voteMap: Record<string, number>
  tripId: string
  destination: string
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

export function ItinerarySection({ days, voteMap, tripId, destination }: ItinerarySectionProps) {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({})
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  function handleActivityClick(activityId: string) {
    setView('list')
    setHighlightedId(activityId)
    // Scroll after the list renders
    setTimeout(() => {
      document.getElementById(`activity-${activityId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Remove highlight after animation completes
      setTimeout(() => setHighlightedId(null), 1800)
    }, 50)
  }

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
    if (!key) return

    const allActivities = days.flatMap(d => d.activities || [])
    allActivities.forEach(async (activity) => {
      try {
        const query = encodeURIComponent(`${activity.title} ${activity.location}`)
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${query}&per_page=1&client_id=${key}`
        )
        const data = await res.json()
        let url = data.results?.[0]?.urls?.small
        if (!url) {
          // Fall back to destination city name only
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
      .filter(a => a.location)
      .map(a => ({
        id: a.id,
        title: a.title,
        time_slot: a.time_slot,
        location: a.location,
        day_number: day.day_number,
        category: a.category,
      }))
  )

  return (
    <div>
      {/* View toggle header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-mono text-[#b8b0a2] uppercase tracking-widest">
          {days.length} {days.length === 1 ? 'day' : 'days'} · {mapActivities.length} activities
        </p>
        <div className="flex items-center gap-0.5 p-1 bg-[#141412] border border-[rgba(242,237,228,0.08)] rounded-lg">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              view === 'list'
                ? 'bg-[#e8623a] text-white shadow-sm'
                : 'text-[#b8b0a2] hover:text-[#f2ede4]'
            }`}
          >
            ☰ List
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              view === 'map'
                ? 'bg-[#e8623a] text-white shadow-sm'
                : 'text-[#b8b0a2] hover:text-[#f2ede4]'
            }`}
          >
            🗺 Map
          </button>
        </div>
      </div>

      {/* Map view */}
      {view === 'map' && (
        <TripMapView activities={mapActivities} destination={destination} onActivityClick={handleActivityClick} />
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-8">
          {days.map(day => (
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
                {(['morning', 'afternoon', 'evening'] as const).map(slot => {
                  const activity = day.activities?.find(a => a.time_slot === slot)
                  if (!activity) return null

                  return (
                    <div
                      key={activity.id}
                      id={`activity-${activity.id}`}
                      className={`bg-[#141412] border rounded-xl p-4 hover:border-[rgba(232,98,58,0.2)] transition-colors ${
                        highlightedId === activity.id
                          ? 'border-[#e8623a] activity-highlight'
                          : 'border-[rgba(242,237,228,0.06)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-[#b8b0a2] uppercase tracking-widest">
                              {slot}
                            </span>
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
                          <div className="flex items-center gap-3">
                            <VoteButtons
                              activityId={activity.id}
                              tripId={tripId}
                              initialScore={activity.vote_score ?? 0}
                              initialVote={voteMap[activity.id] ?? 0}
                            />
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent('share-activity-to-chat', {
                                detail: { activity }
                              }))}
                              className="text-[11px] text-[#b8b0a2] hover:text-[#e8623a] transition-colors flex items-center gap-1 ml-auto"
                            >
                              💬 Share
                            </button>
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
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

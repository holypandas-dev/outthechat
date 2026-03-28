'use client'

import { useState } from 'react'

interface VoteButtonsProps {
  activityId: string
  tripId: string
  initialScore: number
  initialVote?: number // -1, 0, or 1
  initialVoteCount?: number
  onScoreChange?: (score: number, voteCount: number) => void
}

export function VoteButtons({
  activityId,
  tripId,
  initialScore,
  initialVote = 0,
  initialVoteCount = 0,
  onScoreChange,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore)
  const [currentVote, setCurrentVote] = useState(initialVote)
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [loading, setLoading] = useState(false)

  async function handleVote(value: number) {
    if (loading) return

    // If clicking same vote, toggle it off (set to 0)
    const newValue = currentVote === value ? 0 : value

    setLoading(true)

    // Optimistic updates
    const scoreDiff = newValue - currentVote
    setScore(prev => prev + scoreDiff)
    setCurrentVote(newValue)

    // Optimistic vote count update
    const wasVoting = currentVote !== 0
    const willVote = newValue !== 0
    if (!wasVoting && willVote) setVoteCount(prev => prev + 1)
    else if (wasVoting && !willVote) setVoteCount(prev => Math.max(0, prev - 1))

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, tripId, value: newValue }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Sync with server values
      setScore(data.score)
      setVoteCount(data.voteCount ?? voteCount)
      onScoreChange?.(data.score, data.voteCount ?? voteCount)
    } catch {
      // Revert on error
      setScore(prev => prev - scoreDiff)
      setCurrentVote(currentVote)
      if (!wasVoting && willVote) setVoteCount(prev => Math.max(0, prev - 1))
      else if (wasVoting && !willVote) setVoteCount(prev => prev + 1)
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1.5 mt-3">
      {/* Thumbs up */}
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
          currentVote === 1
            ? 'bg-green-950/60 border border-green-700/50 text-green-400'
            : 'bg-[rgba(242,237,228,0.04)] border border-[rgba(242,237,228,0.08)] text-[#b8b0a2] hover:border-green-700/40 hover:text-green-400'
        }`}
      >
        👍 {currentVote === 1 ? 'In' : 'Up'}
      </button>

      {/* Score */}
      <span className={`text-xs font-mono min-w-[20px] text-center ${
        score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-[#b8b0a2]'
      }`}>
        {score > 0 ? `+${score}` : score}
      </span>

      {/* Thumbs down */}
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
          currentVote === -1
            ? 'bg-red-950/60 border border-red-700/50 text-red-400'
            : 'bg-[rgba(242,237,228,0.04)] border border-[rgba(242,237,228,0.08)] text-[#b8b0a2] hover:border-red-700/40 hover:text-red-400'
        }`}
      >
        👎 {currentVote === -1 ? 'Out' : 'Down'}
      </button>
    </div>
  )
}

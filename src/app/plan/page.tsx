'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const VIBES = [
  { id: 'food_adventure', label: '🍜 Food adventure', desc: 'Eat everything, find hidden spots' },
  { id: 'luxury', label: '✨ Luxury soft life', desc: 'Five star everything' },
  { id: 'backpacker', label: '🎒 Backpacker', desc: 'Budget, authentic, off the beaten path' },
  { id: 'girls_trip', label: '💅 Girls trip', desc: 'Vibes, brunch, and good times' },
  { id: 'nightlife', label: '🎉 Party & nightlife', desc: 'Clubs, bars, and late nights' },
  { id: 'wellness', label: '🧘 Wellness retreat', desc: 'Spas, nature, and recharge' },
  { id: 'culture', label: '🏛️ Culture & history', desc: 'Museums, architecture, and local life' },
  { id: 'adventure', label: '🏄 Adventure', desc: 'Hiking, surfing, and adrenaline' },
]

export default function PlanPage() {
  const router = useRouter()

  const [destination, setDestination] = useState('')
  const [days, setDays] = useState('5')
  const [vibes, setVibes] = useState<string[]>([])
  const [budget, setBudget] = useState('mid')
  const [groupSize, setGroupSize] = useState('2')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleVibe(id: string) {
    setVibes(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!destination.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          destination,
          days,
          vibe: vibes.join(', '),
          budget,
          groupSize,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Generation failed')

      router.push(`/trip/${data.tripId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a09]">

      {/* Nav */}
      <nav className="border-b border-[rgba(242,237,228,0.08)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="font-mono text-sm">
          <span className="text-[#e8623a]">Out</span>
          <span className="text-[#f2ede4]">TheChat</span>
        </a>
        <a href="/dashboard" className="text-sm text-[#b8b0a2] hover:text-[#f2ede4] transition-colors">
          ← Dashboard
        </a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-[11px] text-[#e8623a] uppercase tracking-widest mb-3">
            AI Trip Generator
          </p>
          <h1 className="text-3xl font-semibold text-[#f2ede4] leading-tight">
            Where are we going?
          </h1>
          <p className="text-[#b8b0a2] mt-2 text-sm">
            Describe your trip and the AI will build a full itinerary in seconds.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">

          {/* Destination */}
          <div>
            <label className="block text-xs font-medium text-[#b8b0a2] mb-2 uppercase tracking-wide">
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
              placeholder="Tokyo, Japan"
              className="w-full bg-[#141412] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-[#f2ede4] text-base placeholder-[#b8b0a2]/40 outline-none focus:border-[rgba(232,98,58,0.5)] transition-colors"
            />
          </div>

          {/* Days + Group size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#b8b0a2] mb-2 uppercase tracking-wide">
                Duration
              </label>
              <select
                value={days}
                onChange={e => setDays(e.target.value)}
                className="w-full bg-[#141412] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-[#f2ede4] text-sm outline-none focus:border-[rgba(232,98,58,0.5)] transition-colors"
              >
                {[2,3,4,5,6,7,10,14].map(d => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#b8b0a2] mb-2 uppercase tracking-wide">
                Group size
              </label>
              <select
                value={groupSize}
                onChange={e => setGroupSize(e.target.value)}
                className="w-full bg-[#141412] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-[#f2ede4] text-sm outline-none focus:border-[rgba(232,98,58,0.5)] transition-colors"
              >
                {[1,2,3,4,5,6,8,10].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Trip dates */}
          <div>
            <label className="block text-xs font-medium text-[#b8b0a2] mb-2 uppercase tracking-wide">
              Trip dates <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-[#b8b0a2]/60 mb-1.5 uppercase tracking-wide">
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-[#141412] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-[#f2ede4] text-sm outline-none focus:border-[rgba(232,98,58,0.5)] transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#b8b0a2]/60 mb-1.5 uppercase tracking-wide">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="w-full bg-[#141412] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-[#f2ede4] text-sm outline-none focus:border-[rgba(232,98,58,0.5)] transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-medium text-[#b8b0a2] mb-2 uppercase tracking-wide">
              Budget
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'budget', label: '💰 Budget', desc: 'Keep it cheap' },
                { id: 'mid', label: '💳 Mid-range', desc: 'Comfortable' },
                { id: 'luxury', label: '💎 Luxury', desc: 'Spare no expense' },
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBudget(b.id)}
                  className={`p-3 rounded-lg border text-left transition-all duration-150 active:scale-95 ${
                    budget === b.id
                      ? 'border-[#e8623a] bg-[rgba(232,98,58,0.08)] scale-[1.02]'
                      : 'border-[rgba(242,237,228,0.08)] bg-[#141412] hover:border-[rgba(242,237,228,0.2)]'
                  }`}
                >
                  <div className="text-sm text-[#f2ede4]">{b.label}</div>
                  <div className="text-xs text-[#b8b0a2] mt-0.5">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe — multi-select */}
          <div>
            <label className="block text-xs font-medium text-[#b8b0a2] mb-2 uppercase tracking-wide">
              Vibe{' '}
              <span className="text-[#b8b0a2] normal-case font-normal">
                (optional — pick as many as you want)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VIBES.map(v => {
                const selected = vibes.includes(v.id)
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVibe(v.id)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 active:scale-95 ${
                      selected
                        ? 'border-[#e8623a] bg-[rgba(232,98,58,0.08)] scale-[1.02]'
                        : 'border-[rgba(242,237,228,0.08)] bg-[#141412] hover:border-[rgba(242,237,228,0.2)]'
                    }`}
                  >
                    <div className="text-sm text-[#f2ede4]">{v.label}</div>
                    <div className="text-xs text-[#b8b0a2] mt-0.5">{v.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Extra prompt */}
          <div>
            <label className="block text-xs font-medium text-[#b8b0a2] mb-2 uppercase tracking-wide">
              Anything else? <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. We love ramen, hate touristy spots, and want to see cherry blossoms..."
              rows={3}
              className="w-full bg-[#141412] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-[#f2ede4] text-sm placeholder-[#b8b0a2]/40 outline-none focus:border-[rgba(232,98,58,0.5)] transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-lg px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !destination.trim()}
            className="w-full bg-[#e8623a] hover:bg-[#c44d28] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg px-6 py-4 text-base transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-pulse">✈️</span>
                Generating your trip...
              </span>
            ) : (
              'Generate itinerary →'
            )}
          </button>

          {loading && (
            <p className="text-center text-xs text-[#b8b0a2] animate-pulse">
              The AI is planning your trip — this takes about 10–15 seconds
            </p>
          )}

        </form>
      </main>
    </div>
  )
}

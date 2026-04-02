'use client'

import { useState, useEffect } from 'react'
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function PlanPage() {
  const router = useRouter()

  const [destination, setDestination] = useState('')
  const [departureCity, setDepartureCity] = useState('')
  const [days, setDays] = useState('5')
  const [vibes, setVibes] = useState<string[]>([])
  const [budget, setBudget] = useState('mid')
  const [groupSize, setGroupSize] = useState('2')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelMonth, setTravelMonth] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [bestTimeHint, setBestTimeHint] = useState('')
  const [bestTimeLoading, setBestTimeLoading] = useState(false)

  // Fetch "best time to visit" hint when destination changes
  useEffect(() => {
    if (!destination.trim() || destination.trim().length < 3) {
      setBestTimeHint('')
      setBestTimeLoading(false)
      return
    }
    setBestTimeLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/best-time?destination=${encodeURIComponent(destination.trim())}`)
        const data = await res.json()
        setBestTimeHint(data.hint || '')
      } catch {
        setBestTimeHint('')
      } finally {
        setBestTimeLoading(false)
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [destination])

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
          departureCity: departureCity || null,
          days,
          vibe: vibes.join(', '),
          budget,
          groupSize,
          startDate: startDate || null,
          endDate: endDate || null,
          travelMonth: (!startDate && !endDate && travelMonth) ? travelMonth : null,
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
    <div className="min-h-screen bg-[#0f0d0b]">

      {/* Nav */}
      <nav className="border-b border-[rgba(242,237,228,0.08)] px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="font-mono text-sm">
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </a>
        <a href="/dashboard" className="text-sm hover:text-text-primary transition-colors" style={{ color: 'var(--text-secondary)' }}>
          ← Dashboard
        </a>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            AI Trip Generator
          </p>
          <h1 className="text-3xl font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
            Where are we going?
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Describe your trip and the AI will build a full itinerary in seconds.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">

          {/* Destination */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
              placeholder="Tokyo, Japan"
              className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-base placeholder-text-secondary/40 outline-none focus:border-accent/50 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            />
            {/* Best time to visit hint */}
            <div className="min-h-[28px] mt-2">
              {bestTimeLoading && destination.trim().length >= 3 && (
                <div className="flex items-center gap-2 text-xs text-text-secondary/60">
                  <span className="animate-pulse">⏳</span>
                  <span>Looking up best time to visit...</span>
                </div>
              )}
              {!bestTimeLoading && bestTimeHint && (
                <div className="flex items-start gap-2 text-xs bg-[rgba(196,86,58,0.06)] border border-[rgba(196,86,58,0.15)] rounded-lg px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex-shrink-0 mt-px" style={{ color: 'var(--accent)' }}>💡</span>
                  <span>{bestTimeHint}</span>
                </div>
              )}
            </div>
          </div>

          {/* Departure city */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Departure city <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={departureCity}
              onChange={e => setDepartureCity(e.target.value)}
              placeholder="New York, NY"
              className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm placeholder-text-secondary/40 outline-none focus:border-accent/50 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            />
            <p className="text-[10px] text-text-secondary/50 mt-1.5">
              Helps the AI estimate realistic flight costs in your budget
            </p>
          </div>

          {/* Days + Group size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Duration
              </label>
              <select
                value={days}
                onChange={e => setDays(e.target.value)}
                className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm outline-none focus:border-[rgba(196,86,58,0.5)] transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {[2,3,4,5,6,7,10,14].map(d => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Group size
              </label>
              <select
                value={groupSize}
                onChange={e => setGroupSize(e.target.value)}
                className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm outline-none focus:border-[rgba(196,86,58,0.5)] transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {[1,2,3,4,5,6,8,10].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Trip dates */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Trip dates <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); if (e.target.value) setTravelMonth('') }}
                  className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm outline-none focus:border-[rgba(196,86,58,0.5)] transition-colors [color-scheme:dark]"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); if (e.target.value) setTravelMonth('') }}
                  min={startDate || undefined}
                  className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm outline-none focus:border-[rgba(196,86,58,0.5)] transition-colors [color-scheme:dark]"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Travel month — shown only when no specific dates set */}
          {!startDate && !endDate && (
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Thinking of going in... <span className="normal-case font-normal">(optional)</span>
              </label>
              <select
                value={travelMonth}
                onChange={e => setTravelMonth(e.target.value)}
                className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm outline-none focus:border-[rgba(196,86,58,0.5)] transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                <option value="">Not sure yet</option>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <p className="text-[10px] text-text-secondary/50 mt-1.5">
                Helps the AI factor in seasonal events, weather, and pricing
              </p>
            </div>
          )}

          {/* Budget */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
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
                      ? 'border-accent bg-accent/8 scale-[1.02]'
                      : 'border-[rgba(242,237,228,0.08)] bg-[#1a1612] hover:border-[rgba(242,237,228,0.2)]'
                  }`}
                >
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{b.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe — multi-select */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Vibe{' '}
              <span className="normal-case font-normal" style={{ color: 'var(--text-secondary)' }}>
                (optional — pick as many as you want)
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VIBES.map(v => {
                const selected = vibes.includes(v.id)
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVibe(v.id)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 active:scale-95 ${
                      selected
                        ? 'border-accent bg-accent/8 scale-[1.02]'
                        : 'border-[rgba(242,237,228,0.08)] bg-[#1a1612] hover:border-[rgba(242,237,228,0.2)]'
                    }`}
                  >
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{v.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{v.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Extra prompt */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Anything else? <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. We love ramen, hate touristy spots, and want to see cherry blossoms..."
              rows={3}
              className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm placeholder-text-secondary/40 outline-none focus:border-accent/50 transition-colors resize-none"
              style={{ color: 'var(--text-primary)' }}
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
            className="w-full hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg px-6 py-4 text-base transition-colors"
            style={{ background: 'var(--accent)' }}
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
            <p className="text-center text-xs animate-pulse" style={{ color: 'var(--text-secondary)' }}>
              The AI is planning your trip — this takes about 10–15 seconds
            </p>
          )}

        </form>
      </main>
    </div>
  )
}

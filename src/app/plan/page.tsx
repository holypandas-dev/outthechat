'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'

const VIBES = [
  { id: 'food_adventure', label: 'Food adventure', desc: 'Eat everything, find hidden spots' },
  { id: 'luxury', label: 'Luxury soft life', desc: 'Five star everything' },
  { id: 'backpacker', label: 'Backpacker', desc: 'Budget, authentic, off the beaten path' },
  { id: 'girls_trip', label: 'Girls trip', desc: 'Vibes, brunch, and good times' },
  { id: 'nightlife', label: 'Party & nightlife', desc: 'Clubs, bars, and late nights' },
  { id: 'wellness', label: 'Wellness retreat', desc: 'Spas, nature, and recharge' },
  { id: 'culture', label: 'Culture & history', desc: 'Museums, architecture, and local life' },
  { id: 'adventure', label: 'Adventure', desc: 'Hiking, surfing, and adrenaline' },
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

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
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

  const inputStyle = {
    width: '100%',
    background: 'var(--surface)',
    border: '0.5px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>

      <Nav />

      <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div style={{ width: '24px', height: '0.5px', background: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              AI Trip Generator
            </span>
          </div>
          <h1
            className="font-medium mb-3"
            style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(32px, 5vw, 42px)', letterSpacing: '-0.02em', lineHeight: '1.1', color: 'var(--text-primary)' }}
          >
            Where are we going?
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            Describe your trip and the AI will build a full itinerary in seconds.
          </p>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Destination */}
          <div>
            <label style={labelStyle}>Destination *</label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
              placeholder="Tokyo, Japan"
              style={inputStyle}
            />
            <div style={{ minHeight: '32px', marginTop: '8px' }}>
              {bestTimeLoading && destination.trim().length >= 3 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Looking up best time to visit...
                </p>
              )}
              {!bestTimeLoading && bestTimeHint && (
                <div style={{
                  fontSize: '12px',
                  background: 'var(--accent-muted)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                }}>
                  <span style={{ color: 'var(--accent)', fontWeight: '500' }}>Best time to visit — </span>
                  {bestTimeHint}
                </div>
              )}
            </div>
          </div>

          {/* Departure city */}
          <div>
            <label style={labelStyle}>
              Departure city <span style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={departureCity}
              onChange={e => setDepartureCity(e.target.value)}
              placeholder="Los Angeles, CA"
              style={inputStyle}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Helps the AI estimate realistic flight costs in your budget
            </p>
          </div>

          {/* Duration + Group size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Duration</label>
              <select
                value={days}
                onChange={e => setDays(e.target.value)}
                style={inputStyle}
              >
                {[2,3,4,5,6,7,10,14].map(d => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Group size</label>
              <select
                value={groupSize}
                onChange={e => setGroupSize(e.target.value)}
                style={inputStyle}
              >
                {[1,2,3,4,5,6,8,10].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Trip dates */}
          <div>
            <label style={labelStyle}>
              Trip dates <span style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Start date</p>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); if (e.target.value) setTravelMonth('') }}
                  style={{ ...inputStyle, colorScheme: 'light dark' }}
                />
              </div>
              <div>
                <p style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>End date</p>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); if (e.target.value) setTravelMonth('') }}
                  min={startDate || undefined}
                  style={{ ...inputStyle, colorScheme: 'light dark' }}
                />
              </div>
            </div>
          </div>

          {/* Travel month */}
          {!startDate && !endDate && (
            <div>
              <label style={labelStyle}>
                Thinking of going in... <span style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</span>
              </label>
              <select
                value={travelMonth}
                onChange={e => setTravelMonth(e.target.value)}
                style={inputStyle}
              >
                <option value="">Not sure yet</option>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Helps the AI factor in seasonal events, weather, and pricing
              </p>
            </div>
          )}

          {/* Budget */}
          <div>
            <label style={labelStyle}>Budget</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { id: 'budget', label: 'Budget', desc: 'Keep it affordable' },
                { id: 'mid', label: 'Mid-range', desc: 'Comfortable' },
                { id: 'luxury', label: 'Luxury', desc: 'Spare no expense' },
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBudget(b.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: budget === b.id ? '1px solid var(--accent)' : '0.5px solid var(--border)',
                    background: budget === b.id ? 'var(--accent-muted)' : 'var(--surface)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>{b.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div>
            <label style={labelStyle}>
              Vibe <span style={{ textTransform: 'none', fontWeight: '400' }}>(optional — pick as many as you want)</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {VIBES.map(v => {
                const selected = vibes.includes(v.id)
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVibe(v.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: selected ? '1px solid var(--accent)' : '0.5px solid var(--border)',
                      background: selected ? 'var(--accent-muted)' : 'var(--surface)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>{v.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Extra prompt */}
          <div>
            <label style={labelStyle}>
              Anything else? <span style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. We love ramen, hate touristy spots, and want to see cherry blossoms..."
              rows={3}
              style={{ ...inputStyle, resize: 'none', lineHeight: '1.6' }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--surface)',
              border: '0.5px solid #E57373',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#C62828',
            }}>
              {error}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '0.5px', background: 'var(--border)' }} />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !destination.trim()}
            style={{
              width: '100%',
              background: loading || !destination.trim() ? 'var(--text-muted)' : 'var(--text-primary)',
              color: 'var(--background)',
              fontWeight: '500',
              fontSize: '15px',
              padding: '16px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading || !destination.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Generating your trip...' : 'Generate itinerary →'}
          </button>

          {loading && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', animation: 'pulse 2s infinite' }}>
              The AI is planning your trip — this takes about 10–15 seconds
            </p>
          )}

        </form>
      </main>
    </div>
  )
}

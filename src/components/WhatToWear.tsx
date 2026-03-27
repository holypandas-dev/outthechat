'use client'

import { useState } from 'react'

interface WhatToWearData {
  weather_expectations: string
  recommended_clothing: string[]
  what_not_to_bring: string[]
  packing_checklist: {
    essentials: string[]
    clothing: string[]
    toiletries: string[]
    accessories: string[]
  }
}

interface WhatToWearProps {
  tripId: string
  initialData: WhatToWearData | null
}

export function WhatToWear({ tripId, initialData }: WhatToWearProps) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<WhatToWearData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    const nextOpen = !open
    setOpen(nextOpen)

    if (nextOpen && !data && !loading) {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/what-to-wear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId }),
        })
        if (!res.ok) throw new Error('Failed to generate')
        const json = await res.json()
        setData(json.data)
      } catch {
        setError('Could not generate packing advice. Try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="bg-[#141412] border border-[rgba(242,237,228,0.08)] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-[rgba(242,237,228,0.03)] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">👗</span>
          <p className="text-xs font-mono text-[#e8623a] uppercase tracking-widest">
            What to wear
          </p>
        </div>
        <span className="text-[#b8b0a2] text-sm transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▾
        </span>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 border-t border-[rgba(242,237,228,0.06)]">
          {loading && (
            <div className="pt-4 flex items-center gap-2 text-sm text-[#b8b0a2]">
              <span className="inline-block w-3 h-3 border border-[#e8623a] border-t-transparent rounded-full animate-spin" />
              Generating packing advice…
            </div>
          )}

          {error && (
            <div className="pt-4 text-sm text-[#b8b0a2]">
              {error}
              <button
                onClick={() => { setData(null); setLoading(false); setError(null); handleToggle() }}
                className="ml-2 text-[#e8623a] underline"
              >
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="pt-4 space-y-5">
              {/* Weather */}
              <div>
                <p className="text-xs font-mono text-[#b8b0a2] uppercase tracking-widest mb-1.5">
                  ☁️ Weather
                </p>
                <p className="text-sm text-[#f2ede4] leading-relaxed">
                  {data.weather_expectations}
                </p>
              </div>

              {/* Recommended clothing */}
              <div>
                <p className="text-xs font-mono text-[#b8b0a2] uppercase tracking-widest mb-1.5">
                  ✅ Bring these
                </p>
                <ul className="space-y-1">
                  {data.recommended_clothing.map((item, i) => (
                    <li key={i} className="text-sm text-[#b8b0a2] flex gap-2">
                      <span className="text-[#e8623a] flex-shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* What not to bring */}
              <div>
                <p className="text-xs font-mono text-[#b8b0a2] uppercase tracking-widest mb-1.5">
                  ✕ Leave at home
                </p>
                <ul className="space-y-1">
                  {data.what_not_to_bring.map((item, i) => (
                    <li key={i} className="text-sm text-[#b8b0a2] flex gap-2">
                      <span className="text-[rgba(232,98,58,0.5)] flex-shrink-0">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Packing checklist */}
              <div>
                <p className="text-xs font-mono text-[#b8b0a2] uppercase tracking-widest mb-2">
                  🧳 Packing checklist
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      { key: 'essentials', label: 'Essentials' },
                      { key: 'clothing', label: 'Clothing' },
                      { key: 'toiletries', label: 'Toiletries' },
                      { key: 'accessories', label: 'Accessories' },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-xs text-[#e8623a] font-mono mb-1">{label}</p>
                      <ul className="space-y-1">
                        {data.packing_checklist[key].map((item, i) => (
                          <li key={i} className="text-xs text-[#b8b0a2] flex gap-1.5 items-start">
                            <span className="mt-0.5 flex-shrink-0 w-3 h-3 rounded border border-[rgba(242,237,228,0.15)]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

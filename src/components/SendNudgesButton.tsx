'use client'

import { useState } from 'react'

export function SendNudgesButton({ tripId }: { tripId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [count, setCount] = useState(0)

  async function handleSend() {
    setStatus('loading')
    try {
      const res = await fetch('/api/send-nudges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCount(data.count ?? 0)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const label = {
    idle: '📣 Send nudges',
    loading: 'Sending...',
    done: count > 0 ? `✓ ${count} nudge${count === 1 ? '' : 's'} sent` : '✓ No nudges needed',
    error: 'Failed — try again',
  }[status]

  return (
    <button
      onClick={handleSend}
      disabled={status === 'loading'}
      className="bg-[#141412] border border-[rgba(242,237,228,0.1)] hover:border-[rgba(232,98,58,0.4)] text-[#f2ede4] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  )
}

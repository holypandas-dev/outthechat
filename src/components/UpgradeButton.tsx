'use client'

import { useState } from 'react'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/subscription', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%',
        padding: '11px',
        background: loading ? 'var(--accent-muted)' : 'var(--accent)',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        color: loading ? 'var(--accent)' : '#fff',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {loading ? 'Redirecting…' : 'Upgrade to Premium →'}
    </button>
  )
}

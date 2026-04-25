'use client'

import { useState } from 'react'

export function CopyLinkButtonCard({ tripId }: { tripId: string }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    setLoading(true)
    try {
      const res = await fetch('/api/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      })
      const data = await res.json()
      const link = `${window.location.origin}/join/${data.token}`
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      alert('Failed to create invite link')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleCopy}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: copied ? '#dcfce7' : 'var(--surface)',
        border: `0.5px solid ${copied ? '#86efac' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '6px 14px',
        fontSize: 12,
        fontFamily: 'var(--font-geist-mono, monospace)',
        fontWeight: 500,
        color: copied ? '#4ade80' : 'var(--text-secondary)',
        cursor: loading ? 'default' : 'pointer',
        letterSpacing: '0.04em',
        transition: 'all 0.2s',
        opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ COPIED' : loading ? '...' : '🔗 COPY INVITE LINK'}
    </button>
  )
}

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
        background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(242,237,228,0.07)',
        border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(242,237,228,0.13)'}`,
        borderRadius: 8,
        padding: '6px 14px',
        fontSize: 12,
        fontFamily: 'var(--font-geist-mono, monospace)',
        fontWeight: 500,
        color: copied ? '#4ade80' : '#b8b0a2',
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

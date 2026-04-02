'use client'

import { useState } from 'react'

export function InviteButton({ tripId }: { tripId: string }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleInvite() {
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
      onClick={handleInvite}
      disabled={loading}
      className="text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 text-center"
      style={{
        background: 'var(--text-primary)',
        color: 'var(--background)',
        border: '0.5px solid var(--border)',
      }}
    >
      {loading ? 'Generating...' : copied ? 'Link copied' : 'Invite friends'}
    </button>
  )
}
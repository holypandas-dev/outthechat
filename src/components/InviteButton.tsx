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
      className="bg-[#1a1612] border border-[rgba(242,237,228,0.1)] hover:border-[rgba(196,86,58,0.4)] text-[#f5efe6] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
    >
      {loading ? 'Generating...' : copied ? '✓ Link copied!' : '🔗 Invite friends'}
    </button>
  )
}
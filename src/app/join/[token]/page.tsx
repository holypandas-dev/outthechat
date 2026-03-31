'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function JoinTripPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error' | 'already'>('loading')
  const [tripTitle, setTripTitle] = useState('')
  const [tripId, setTripId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function joinTrip() {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?next=/join/${token}`)
        return
      }

      setStatus('joining')

      // Call server-side API to validate token and join (bypasses RLS)
      const res = await fetch('/api/join-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user_id: user.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'This invite link is invalid or has expired.')
        setStatus('error')
        return
      }

      setTripTitle(data.trip_title)
      setTripId(data.trip_id)

      if (data.already_member) {
        setStatus('already')
        return
      }

      setStatus('success')

      // Redirect to trip after short delay
      setTimeout(() => router.push(`/trip/${data.trip_id}`), 1500)
    }

    joinTrip()
  }, [token])

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* Logo */}
        <div className="mb-10">
          <span className="font-mono text-lg">
            <span className="text-[#C4563A]">Out</span>
            <span className="text-[#f5efe6]">TheChat</span>
          </span>
        </div>

        <div className="bg-[#1a1612] border border-[rgba(242,237,228,0.08)] rounded-2xl p-8">

          {status === 'loading' && (
            <div>
              <div className="text-3xl mb-4 animate-pulse">✈️</div>
              <p className="text-[#b8b0a2] text-sm">Loading invite...</p>
            </div>
          )}

          {status === 'joining' && (
            <div>
              <div className="text-3xl mb-4 animate-pulse">🔗</div>
              <p className="text-[#f5efe6] font-medium mb-1">Joining trip...</p>
              <p className="text-[#b8b0a2] text-sm">{tripTitle}</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="text-3xl mb-4">🎉</div>
              <p className="text-[#f5efe6] font-medium mb-1">You're in!</p>
              <p className="text-[#b8b0a2] text-sm mb-4">{tripTitle}</p>
              <p className="text-xs text-[#b8b0a2] animate-pulse">
                Taking you to the trip...
              </p>
            </div>
          )}

          {status === 'already' && (
            <div>
              <div className="text-3xl mb-4">👋</div>
              <p className="text-[#f5efe6] font-medium mb-1">You're already in!</p>
              <p className="text-[#b8b0a2] text-sm mb-6">{tripTitle}</p>
              <Link
                href={`/trip/${tripId}`}
                className="inline-block bg-[#C4563A] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#a64428] transition-colors"
              >
                View trip →
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="text-3xl mb-4">😕</div>
              <p className="text-[#f5efe6] font-medium mb-1">Something went wrong</p>
              <p className="text-[#b8b0a2] text-sm mb-6">{error}</p>
              <Link
                href="/dashboard"
                className="inline-block border border-[rgba(242,237,228,0.1)] text-[#b8b0a2] text-sm font-medium px-6 py-2.5 rounded-lg hover:text-[#f5efe6] transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
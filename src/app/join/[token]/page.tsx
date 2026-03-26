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
        // Save token and redirect to login
        router.push(`/login?next=/join/${token}`)
        return
      }

      setStatus('joining')

      // Look up invite link
      const { data: invite, error: inviteError } = await supabase
        .from('invite_links')
        .select('*, trips(id, title)')
        .eq('token', token)
        .maybeSingle()

      if (inviteError || !invite) {
        setError('This invite link is invalid or has expired.')
        setStatus('error')
        return
      }

      const trip = invite.trips as { id: string; title: string }
      setTripTitle(trip.title)
      setTripId(trip.id)

      // Check if already a member
      const { data: existing } = await supabase
        .from('trip_members')
        .select('id')
        .eq('trip_id', trip.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        setStatus('already')
        return
      }

      // Add user as trip member
      const { error: joinError } = await supabase
        .from('trip_members')
        .insert({
          trip_id: trip.id,
          user_id: user.id,
          role: 'member',
          interest_status: 'in',
        })

      if (joinError) {
        setError('Failed to join trip. Please try again.')
        setStatus('error')
        return
      }

      // Update invite use count
      await supabase
        .from('invite_links')
        .update({ use_count: (invite.use_count || 0) + 1 })
        .eq('id', invite.id)

      setStatus('success')

      // Redirect to trip after short delay
      setTimeout(() => router.push(`/trip/${trip.id}`), 1500)
    }

    joinTrip()
  }, [token])

  return (
    <div className="min-h-screen bg-[#0a0a09] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* Logo */}
        <div className="mb-10">
          <span className="font-mono text-lg">
            <span className="text-[#e8623a]">Out</span>
            <span className="text-[#f2ede4]">TheChat</span>
          </span>
        </div>

        <div className="bg-[#141412] border border-[rgba(242,237,228,0.08)] rounded-2xl p-8">

          {status === 'loading' && (
            <div>
              <div className="text-3xl mb-4 animate-pulse">✈️</div>
              <p className="text-[#b8b0a2] text-sm">Loading invite...</p>
            </div>
          )}

          {status === 'joining' && (
            <div>
              <div className="text-3xl mb-4 animate-pulse">🔗</div>
              <p className="text-[#f2ede4] font-medium mb-1">Joining trip...</p>
              <p className="text-[#b8b0a2] text-sm">{tripTitle}</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="text-3xl mb-4">🎉</div>
              <p className="text-[#f2ede4] font-medium mb-1">You're in!</p>
              <p className="text-[#b8b0a2] text-sm mb-4">{tripTitle}</p>
              <p className="text-xs text-[#b8b0a2] animate-pulse">
                Taking you to the trip...
              </p>
            </div>
          )}

          {status === 'already' && (
            <div>
              <div className="text-3xl mb-4">👋</div>
              <p className="text-[#f2ede4] font-medium mb-1">You're already in!</p>
              <p className="text-[#b8b0a2] text-sm mb-6">{tripTitle}</p>
              <Link
                href={`/trip/${tripId}`}
                className="inline-block bg-[#e8623a] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#c44d28] transition-colors"
              >
                View trip →
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="text-3xl mb-4">😕</div>
              <p className="text-[#f2ede4] font-medium mb-1">Something went wrong</p>
              <p className="text-[#b8b0a2] text-sm mb-6">{error}</p>
              <Link
                href="/dashboard"
                className="inline-block border border-[rgba(242,237,228,0.1)] text-[#b8b0a2] text-sm font-medium px-6 py-2.5 rounded-lg hover:text-[#f2ede4] transition-colors"
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
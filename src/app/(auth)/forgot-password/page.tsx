'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-semibold text-[#f5efe6] mb-2">Check your email</h2>
          <p className="text-sm text-[#b8b0a2]">
            We sent a password reset link to <span className="text-[#f5efe6]">{email}</span>.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm text-[#C4563A] hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-mono text-sm tracking-widest text-[#C4563A]">Out</span>
            <span className="font-mono text-sm tracking-widest text-[#f5efe6]">TheChat</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-[#f5efe6]">Forgot your password?</h1>
          <p className="mt-2 text-sm text-[#b8b0a2]">Enter your email and we'll send a reset link</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#b8b0a2] mb-1.5 tracking-wide uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-[#1a1612] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-sm text-[#f5efe6] placeholder-[#b8b0a2]/40 outline-none focus:border-[rgba(196,86,58,0.5)] transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-lg px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C4563A] hover:bg-[#a64428] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#b8b0a2]">
          Remember it?{' '}
          <Link href="/login" className="text-[#C4563A] hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

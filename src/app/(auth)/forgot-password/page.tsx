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
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Check your email</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            We sent a password reset link to <span style={{ color: 'var(--text-primary)' }}>{email}</span>.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm hover:underline"
            style={{ color: 'var(--accent)' }}
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
            <span className="font-mono text-sm tracking-widest" style={{ color: 'var(--accent)' }}>Out</span>
            <span className="font-mono text-sm tracking-widest" style={{ color: 'var(--text-primary)' }}>TheChat</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Forgot your password?</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Enter your email and we'll send a reset link</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm placeholder-text-secondary/40 outline-none focus:border-accent/50 transition-colors"
              style={{ color: 'var(--text-primary)' }}
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
            className="w-full hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Remember it?{' '}
          <Link href="/login" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

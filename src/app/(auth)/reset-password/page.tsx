'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      setError('invalid_link')
      return
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setError('invalid_link')
        } else {
          setSessionReady(true)
        }
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (error === 'invalid_link') {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="inline-block mb-8">
            <span className="font-mono text-sm tracking-widest" style={{ color: 'var(--accent)' }}>Out</span>
            <span className="font-mono text-sm tracking-widest" style={{ color: 'var(--text-primary)' }}>TheChat</span>
          </Link>
          <div className="bg-red-950/50 border border-red-800/50 rounded-lg px-4 py-4 text-sm text-red-300 mb-6">
            This password reset link is invalid or has expired.
          </div>
          <Link href="/forgot-password" className="text-sm hover:text-accent-hover transition-colors" style={{ color: 'var(--accent)' }}>
            Request a new reset link
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
          <h1 className="mt-6 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Set new password</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Choose a strong password for your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={!sessionReady}
              placeholder="Min. 6 characters"
              className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm placeholder-text-secondary/40 outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
              disabled={!sessionReady}
              placeholder="••••••••"
              className="w-full bg-surface border border-border/40 rounded-lg px-4 py-3 text-sm placeholder-text-secondary/40 outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
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
            disabled={loading || !sessionReady}
            className="w-full hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Updating...' : !sessionReady ? 'Verifying link...' : 'Update password'}
          </button>
        </form>

      </div>
    </div>
  )
}

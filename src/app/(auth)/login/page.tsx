'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const next = searchParams.get('next') || '/dashboard'
    router.push(next)
    router.refresh()
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
          <h1 className="mt-6 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          No account?{' '}
          <Link href="/signup" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}
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
    <div className="min-h-screen bg-[#0a0a09] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-mono text-sm tracking-widest text-[#e8623a]">Out</span>
            <span className="font-mono text-sm tracking-widest text-[#f2ede4]">TheChat</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-[#f2ede4]">Welcome back</h1>
          <p className="mt-2 text-sm text-[#b8b0a2]">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full bg-[#141412] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-sm text-[#f2ede4] placeholder-[#b8b0a2]/40 outline-none focus:border-[rgba(232,98,58,0.5)] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#b8b0a2] tracking-wide uppercase">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-[#e8623a] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#141412] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-sm text-[#f2ede4] placeholder-[#b8b0a2]/40 outline-none focus:border-[rgba(232,98,58,0.5)] transition-colors"
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
            className="w-full bg-[#e8623a] hover:bg-[#c44d28] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-[#b8b0a2]">
          No account?{' '}
          <Link href="/signup" className="text-[#e8623a] hover:underline">
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}
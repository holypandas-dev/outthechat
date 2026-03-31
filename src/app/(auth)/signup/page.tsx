'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">✈️</div>
          <h2 className="text-xl font-semibold text-[#f5efe6] mb-2">Check your email</h2>
          <p className="text-sm text-[#b8b0a2]">
            We sent a confirmation link to <span className="text-[#f5efe6]">{email}</span>.
            Click it to activate your account.
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
          <h1 className="mt-6 text-2xl font-semibold text-[#f5efe6]">Create your account</h1>
          <p className="mt-2 text-sm text-[#b8b0a2]">Start planning trips that actually happen</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#b8b0a2] mb-1.5 tracking-wide uppercase">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Angel"
              className="w-full bg-[#1a1612] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 text-sm text-[#f5efe6] placeholder-[#b8b0a2]/40 outline-none focus:border-[rgba(196,86,58,0.5)] transition-colors"
            />
          </div>

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

          <div>
            <label className="block text-xs font-medium text-[#b8b0a2] mb-1.5 tracking-wide uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min. 6 characters"
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
            {loading ? 'Creating account...' : 'Create account →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#b8b0a2]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#C4563A] hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'

type NavProfile = {
  display_name: string | null
  avatar_url: string | null
  email?: string | null
}

function getInitials(name: string | null | undefined, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

export function Nav({ profile: initialProfile }: { profile?: NavProfile }) {
  const [profile, setProfile] = useState<NavProfile | null>(initialProfile ?? null)

  useEffect(() => {
    if (initialProfile) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single()
      setProfile({
        display_name: data?.display_name ?? null,
        avatar_url: data?.avatar_url ?? null,
        email: user.email,
      })
    })
  }, [])

  const initials = getInitials(profile?.display_name, profile?.email)

  return (
    <nav
      className="px-6 sm:px-10 py-4 flex items-center justify-between sticky top-0 z-10"
      style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--background)' }}
    >
      <Link href="/dashboard" style={{ fontFamily: 'var(--font-fraunces)', fontSize: '15px' }}>
        <span style={{ color: 'var(--accent)' }}>Out</span>
        <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
      </Link>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        <Link href="/profile" className="flex items-center gap-2">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || 'Profile'}
              className="w-8 h-8 rounded-full object-cover"
              style={{ border: '0.5px solid var(--border)' }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent-muted)', border: '0.5px solid var(--border)' }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                {initials}
              </span>
            </div>
          )}
          {profile?.display_name && (
            <span className="hidden sm:inline text-sm" style={{ color: 'var(--text-secondary)' }}>
              {profile.display_name}
            </span>
          )}
        </Link>

        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}

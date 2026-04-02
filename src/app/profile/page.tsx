'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || '')
        setBio(profile.bio || '')
        setAvatarUrl(profile.avatar_url || null)
      }

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    if (!displayName.trim()) { setError('Display name is required'); return }

    setSaving(true)
    setError(null)
    setSuccess(false)

    if (avatarFile) {
      const form = new FormData()
      form.append('file', avatarFile)

      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to upload photo')
        setSaving(false)
        return
      }

      setAvatarUrl(data.url)
      setAvatarFile(null)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName, bio: bio })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      setError(JSON.stringify(updateError, null, 2))
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSaving(false)
  }

  const initials = getInitials(displayName)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center">
        <div className="text-sm font-mono animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b]">
      {/* Nav */}
      <nav className="border-b border-[rgba(242,237,228,0.08)] px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-sm">
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </span>
        <Link
          href="/dashboard"
          className="text-sm hover:text-text-primary transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Your display info shown to your travel crew</p>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group flex-shrink-0"
            >
              {(avatarPreview || avatarUrl) ? (
                <img
                  src={avatarPreview || avatarUrl!}
                  alt="Profile photo"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[rgba(242,237,228,0.1)] group-hover:border-accent transition-colors"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent/15 border-2 border-border/40 group-hover:border-accent transition-colors flex items-center justify-center">
                  <span className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>{initials}</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">Change</span>
              </div>
            </button>

            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Profile photo</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>JPG, PNG or WebP · Max 5MB</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs hover:text-accent-hover transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                {avatarPreview || avatarUrl ? 'Replace photo' : 'Upload photo'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Display name <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full bg-[#1a1612] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 placeholder-[rgba(242,237,228,0.25)] text-sm focus:outline-none focus:border-accent transition-colors"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell your travel crew about yourself..."
              rows={3}
              maxLength={200}
              className="w-full bg-[#1a1612] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 placeholder-[rgba(242,237,228,0.25)] text-sm focus:outline-none focus:border-accent transition-colors resize-none"
              style={{ color: 'var(--text-primary)' }}
            />
            <p className="text-right text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{bio.length}/200</p>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-sm">
              <pre className="whitespace-pre-wrap break-all font-mono text-xs">{error}</pre>
            </div>
          )}

          {success && (
            <div className="bg-green-950/60 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">
              Profile saved!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </main>
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function ProfileSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserId(user.id)

      // Pre-fill name from auth metadata if available
      const fullName = user.user_metadata?.full_name as string | undefined
      if (fullName) setDisplayName(fullName)

      // If they already have a display_name set, skip setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (profile?.display_name) {
        router.replace('/dashboard')
        return
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
    if (!displayName.trim()) { setError('Please enter your name'); return }

    setSaving(true)
    setError(null)

    let avatarUrl: string | null = null

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

      avatarUrl = data.url
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      }, { onConflict: 'id' })

    if (updateError) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  const initials = displayName.trim()
    ? displayName.trim().split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center">
        <div className="text-sm font-mono animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-mono text-lg">
            <span style={{ color: 'var(--accent)' }}>Out</span>
            <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#1a1612] border border-[rgba(242,237,228,0.08)] rounded-2xl p-8">
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Set up your profile</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            Let your travel crew know who you are
          </p>

          <form onSubmit={handleSave} className="space-y-5">

            {/* Avatar */}
            <div className="flex flex-col items-center mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Your photo"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[rgba(242,237,228,0.1)] group-hover:border-accent transition-colors"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-accent/15 border-2 border-dashed border-border/60 group-hover:border-accent transition-colors flex items-center justify-center">
                    <span className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>{initials}</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">
                    {avatarPreview ? 'Change' : 'Add photo'}
                  </span>
                </div>
              </button>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>Optional profile photo</p>
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
                Your name <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                required
                autoFocus
                className="w-full bg-[#0f0d0b] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 placeholder-[rgba(242,237,228,0.25)] text-sm focus:outline-none focus:border-accent transition-colors"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Bio <span className="font-sans normal-case tracking-normal" style={{ color: 'var(--text-secondary)' }}>(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Spontaneous traveller, always down for food..."
                rows={2}
                maxLength={200}
                className="w-full bg-[#0f0d0b] border border-[rgba(242,237,228,0.1)] rounded-lg px-4 py-3 placeholder-[rgba(242,237,228,0.25)] text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm mt-2"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? 'Saving...' : 'Continue to dashboard →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

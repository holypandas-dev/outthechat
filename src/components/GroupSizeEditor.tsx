'use client'

import { useState } from 'react'

interface GroupSizeEditorProps {
  tripId: string
  initialSize: number
  isCreator: boolean
}

export function GroupSizeEditor({ tripId, initialSize, isCreator }: GroupSizeEditorProps) {
  const [size, setSize] = useState(initialSize)
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(initialSize)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (pending === size) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await fetch('/api/trip/update-group-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, groupSize: pending }),
      })
      if (res.ok) setSize(pending)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={pending}
          onChange={e => setPending(Number(e.target.value))}
          autoFocus
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--accent)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-medium"
          style={{ color: 'var(--accent)' }}
        >
          {saving ? '…' : 'Save'}
        </button>
        <button
          onClick={() => { setEditing(false); setPending(size) }}
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Planning for {size} {size === 1 ? 'person' : 'people'}
      </span>
      {isCreator && (
        <button
          onClick={() => setEditing(true)}
          title="Edit group size"
          className="opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-secondary)', lineHeight: 1 }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
    </div>
  )
}

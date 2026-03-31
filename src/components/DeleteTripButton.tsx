'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteTripButton({ tripId, variant = 'action' }: {
  tripId: string
  variant?: 'card' | 'action'
}) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch('/api/delete-trip', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      })
      if (!res.ok) throw new Error('Failed')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      {variant === 'card' ? (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true) }}
          className="p-1.5 rounded-md bg-[#0f0d0b] border border-[rgba(242,237,228,0.12)] text-[#b8b0a2] hover:text-red-400 hover:border-red-800/60 transition-colors"
          title="Delete trip"
        >
          <TrashIcon />
        </button>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="border border-red-900/50 text-red-400 hover:bg-red-950/30 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Delete trip
        </button>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => !loading && setShowConfirm(false)}
        >
          <div
            className="bg-[#1a1612] border border-[rgba(242,237,228,0.12)] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[#f5efe6] font-semibold text-base mb-1">Delete this trip?</h3>
            <p className="text-[#b8b0a2] text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="text-sm text-[#b8b0a2] hover:text-[#f5efe6] px-4 py-2 rounded-lg border border-[rgba(242,237,228,0.08)] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {loading ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

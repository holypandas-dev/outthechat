'use client'

import { useState } from 'react'

interface Member {
  user_id: string
  display_name: string | null
}

interface FundDashboardProps {
  tripId: string
  destination: string
  costPerPerson: number
  costLow: number
  costHigh: number
  groupSize: number
  members: Member[]
  committedUserIds: string[]
  currentUserId: string
}

const AVATAR_COLORS = ['var(--accent)', '#5b8bd4', '#6bbf8e', '#c47bd4', '#e8a23a']

export function FundDashboard({
  tripId,
  destination,
  costPerPerson,
  costLow,
  costHigh,
  groupSize,
  members,
  committedUserIds: initialCommitted,
  currentUserId,
}: FundDashboardProps) {
  const [committedIds, setCommittedIds] = useState<string[]>(initialCommitted)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState('')

  const iCommitted = committedIds.includes(currentUserId)
  const committedCount = committedIds.length
  const allCommitted = committedCount >= groupSize
  const progressPct = Math.min((committedCount / Math.max(groupSize, 1)) * 100, 100)

  async function handleCommit() {
    setCommitting(true)
    setError('')
    try {
      const res = await fetch('/api/commit-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCommittedIds(prev => [...prev, currentUserId])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setCommitting(false)
  }

  const committedSet = new Set(committedIds)

  return (
    <div className="space-y-5">

      {/* Ready to book banner */}
      {allCommitted && (
        <div style={{
          background: 'rgba(22,163,74,0.07)',
          border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: '16px',
          padding: '20px 24px',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', marginBottom: '4px' }}>
            Your group is ready to book!
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Everyone&apos;s committed. Time to lock in the trip.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '11px',
                background: '#003580',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Find hotels on Booking.com →
            </a>
            <a
              href={`https://www.viator.com/search/${encodeURIComponent(destination)}?pid=P00049840`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '11px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Book experiences on Viator →
            </a>
          </div>
        </div>
      )}

      {/* Cost breakdown */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <p style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '11px',
          color: 'var(--accent)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Your share
        </p>
        <p style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '6px' }}>
          ${costPerPerson.toLocaleString()}
          <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '6px' }}>
            per person
          </span>
        </p>
        {(costLow > 0 || costHigh > 0) && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Estimated range{' '}
            <span style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--text-primary)' }}>
              ${costLow.toLocaleString()} – ${costHigh.toLocaleString()}
            </span>
            {' '}per person
          </p>
        )}
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Based on a group of {groupSize} · AI estimate, actual costs may vary
        </p>
      </div>

      {/* Commitment progress */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <p style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '11px',
            color: 'var(--accent)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Group commitment
          </p>
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono)', color: 'var(--text-secondary)' }}>
            {committedCount} / {groupSize}
          </p>
        </div>

        <div style={{
          height: '6px',
          background: 'var(--surface-raised)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: allCommitted ? '#16a34a' : 'var(--accent)',
            borderRadius: '999px',
            transition: 'width 0.6s ease',
          }} />
        </div>

        {/* Member list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map((m, i) => {
            const committed = committedSet.has(m.user_id)
            const isMe = m.user_id === currentUserId
            return (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {m.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {m.display_name ?? 'Member'}
                    {isMe && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>(you)</span>
                    )}
                  </span>
                </div>
                {committed ? (
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>✓ In</span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pending</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Commit action */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        {iCommitted ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '22px', marginBottom: '6px' }}>✓</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#16a34a', marginBottom: '4px' }}>
              You&apos;re committed
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Waiting for the rest of the group to confirm.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Ready to make it official?
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Committing tells your group you&apos;re in and you&apos;ll cover your share.
            </p>

            {error && (
              <p style={{ fontSize: '12px', color: '#f87171', marginBottom: '10px' }}>{error}</p>
            )}

            <button
              onClick={handleCommit}
              disabled={committing}
              style={{
                width: '100%',
                padding: '12px',
                background: committing ? 'var(--surface-raised)' : 'var(--accent)',
                color: committing ? 'var(--text-secondary)' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: committing ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {committing ? 'Saving…' : "I'm in — I'll cover my share"}
            </button>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '10px' }}>
              This is a commitment to your group, not a payment.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

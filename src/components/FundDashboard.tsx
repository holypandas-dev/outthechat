'use client'

import { useState } from 'react'

interface Contribution {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
  profiles: { display_name: string }[] | { display_name: string } | null
}

interface FundDashboardProps {
  tripId: string
  goalAmount: number
  contributions: Contribution[]
  currentUserId: string
  paymentSuccess: boolean
}

export function FundDashboard({
  tripId,
  goalAmount,
  contributions,
  currentUserId,
  paymentSuccess,
}: FundDashboardProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const paidContributions = contributions.filter(c => c.status === 'paid')
  const totalRaisedCents = paidContributions.reduce((sum, c) => sum + c.amount, 0)
  const totalRaised = totalRaisedCents / 100
  const progressPct = Math.min((totalRaised / goalAmount) * 100, 100)

  const suggestions = [
    Math.max(25, Math.round(goalAmount * 0.1)),
    Math.round(goalAmount * 0.25),
    Math.round(goalAmount * 0.5),
  ]

  async function handleContribute() {
    const val = parseFloat(amount)
    if (!val || val < 1) {
      setError('Enter an amount of at least $1')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, amount: val }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {paymentSuccess && (
        <div
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '14px',
            color: '#4ade80',
          }}
        >
          Payment received — your contribution has been added to the group fund!
        </div>
      )}

      {/* Progress card */}
      <div
        style={{
          background: '#141412',
          border: '1px solid rgba(242,237,228,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '11px',
                color: '#e8623a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Group fund
            </p>
            <p style={{ fontSize: '26px', fontWeight: 600, color: '#f2ede4', lineHeight: 1 }}>
              ${totalRaised.toLocaleString()}
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#b8b0a2', marginLeft: '4px' }}>
                raised
              </span>
            </p>
          </div>
          <p style={{ fontSize: '13px', color: '#b8b0a2' }}>
            of{' '}
            <span style={{ fontFamily: 'var(--font-geist-mono)', color: '#f2ede4' }}>
              ${goalAmount.toLocaleString()}
            </span>{' '}
            goal
          </p>
        </div>

        <div
          style={{
            height: '6px',
            background: 'rgba(242,237,228,0.06)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: progressPct >= 100 ? '#4ade80' : '#e8623a',
              borderRadius: '999px',
              transition: 'width 0.6s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <p style={{ fontSize: '12px', color: '#b8b0a2' }}>
            {paidContributions.length} {paidContributions.length === 1 ? 'contribution' : 'contributions'}
          </p>
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono)', color: '#b8b0a2' }}>
            {Math.round(progressPct)}%
          </p>
        </div>
      </div>

      {/* Contribute form */}
      <div
        style={{
          background: '#141412',
          border: '1px solid rgba(242,237,228,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#f2ede4', marginBottom: '16px' }}>
          Add your contribution
        </p>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => setAmount(String(s))}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${amount === String(s) ? '#e8623a' : 'rgba(242,237,228,0.08)'}`,
                background: amount === String(s) ? 'rgba(232,98,58,0.08)' : 'transparent',
                color: amount === String(s) ? '#e8623a' : '#b8b0a2',
                fontSize: '13px',
                fontFamily: 'var(--font-geist-mono)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              ${s}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#b8b0a2',
              fontSize: '14px',
            }}
          >
            $
          </span>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Custom amount"
            style={{
              width: '100%',
              paddingLeft: '28px',
              paddingRight: '16px',
              paddingTop: '10px',
              paddingBottom: '10px',
              background: 'rgba(242,237,228,0.04)',
              border: '1px solid rgba(242,237,228,0.1)',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#f2ede4',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <p style={{ fontSize: '12px', color: '#f87171', marginBottom: '10px' }}>{error}</p>
        )}

        <button
          onClick={handleContribute}
          disabled={loading}
          style={{
            width: '100%',
            padding: '11px',
            background: loading ? '#7a3520' : '#e8623a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Redirecting to payment…' : 'Contribute'}
        </button>

        <p style={{ fontSize: '12px', color: '#b8b0a2', textAlign: 'center', marginTop: '10px' }}>
          Secure payment via Stripe · Test mode
        </p>
      </div>

      {/* Contributors list */}
      {paidContributions.length > 0 && (
        <div
          style={{
            background: '#141412',
            border: '1px solid rgba(242,237,228,0.08)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '11px',
              color: '#e8623a',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Contributors
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paidContributions.map(c => {
              const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: c.user_id === currentUserId ? '#e8623a' : '#5b8bd4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span style={{ fontSize: '14px', color: '#f2ede4' }}>
                      {profile?.display_name ?? 'Anonymous'}
                      {c.user_id === currentUserId && (
                        <span style={{ fontSize: '12px', color: '#b8b0a2', marginLeft: '6px' }}>(you)</span>
                      )}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-geist-mono)', color: '#f2ede4' }}>
                    ${(c.amount / 100).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

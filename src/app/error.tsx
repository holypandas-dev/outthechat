'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--background)' }}
    >
      <div className="max-w-sm w-full text-center">
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-fraunces)', fontSize: '15px' }}>
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </Link>

        <div className="mt-12 mb-6">
          <div style={{ width: '24px', height: '0.5px', background: 'var(--accent)', margin: '0 auto 16px' }} />
          <h1
            className="font-medium mb-3"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '28px',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            An unexpected error occurred. You can try again or head back to your dashboard.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            style={{
              width: '100%',
              background: 'var(--text-primary)',
              color: 'var(--background)',
              fontWeight: '500',
              fontSize: '14px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            style={{
              display: 'block',
              width: '100%',
              fontSize: '14px',
              padding: '12px',
              borderRadius: '8px',
              border: '0.5px solid var(--border)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

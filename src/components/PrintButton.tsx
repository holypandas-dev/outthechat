'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '8px 18px',
        fontSize: '13px',
        fontWeight: 500,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      Print / Save PDF
    </button>
  )
}

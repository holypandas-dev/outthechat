export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center">
      <div className="text-center">
        <div className="font-mono text-sm animate-pulse" style={{ color: 'var(--accent)' }}>
          Loading...
        </div>
      </div>
    </div>
  )
}
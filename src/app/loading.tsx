export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="font-mono text-sm animate-pulse" style={{ color: 'var(--accent)' }}>
          Loading...
        </div>
      </div>
    </div>
  )
}
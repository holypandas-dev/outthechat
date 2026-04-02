import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DeleteTripButton } from '@/components/DeleteTripButton'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.display_name) redirect('/profile/setup')

  const { data: memberRows, error: memberError } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user.id)

  const memberTripIds: string[] = memberRows?.map(r => r.trip_id) ?? []

  let tripsQuery = supabase
    .from('trips')
    .select('*, trip_members(count)')
    .order('created_at', { ascending: false })

  if (memberTripIds.length > 0) {
    tripsQuery = tripsQuery.or(`creator_id.eq.${user.id},id.in.(${memberTripIds.join(',')})`)
  } else {
    tripsQuery = tripsQuery.eq('creator_id', user.id)
  }

  const { data: trips } = await tripsQuery

  const firstName = profile?.display_name?.split(' ')[0] || 'there'
  const initials = getInitials(profile?.display_name, user.email!)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}
        className="px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="text-sm tracking-tight">
          <span className="font-medium" style={{ color: 'var(--accent)', fontFamily: 'var(--font-fraunces)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-fraunces)' }}>TheChat</span>
        </span>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/profile" className="flex items-center gap-2.5 group">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || 'Profile'}
                className="w-8 h-8 rounded-full object-cover transition-colors"
                style={{ border: '1px solid var(--border)' }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{initials}</span>
              </div>
            )}
            <span className="hidden sm:inline text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
              {profile?.display_name || user.email}
            </span>
          </Link>
          <ThemeToggle />
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-fraunces)' }}>
              Hey {firstName} 👋
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {trips && trips.length > 0
                ? `You have ${trips.length} trip${trips.length > 1 ? 's' : ''} in the works`
                : "Let's get your first trip out of the chat"}
            </p>
          </div>
          <Link
            href="/plan"
            className="text-sm font-medium px-5 py-2.5 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap"
            style={{ background: 'var(--accent)', color: 'var(--background)' }}
          >
            + New trip
          </Link>
        </div>

        {/* Trips grid */}
        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => (
              <div key={trip.id} className="relative group">
                <Link
                  href={`/trip/${trip.id}`}
                  className="block rounded-xl p-5 transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Trip header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest mb-1 font-medium"
                        style={{ color: 'var(--accent)', fontFamily: 'var(--font-dm-sans)' }}>
                        {trip.duration_days} days · {trip.budget_tier}
                      </p>
                      <h3 className="font-medium text-base leading-tight"
                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-fraunces)' }}>
                        {trip.title}
                      </h3>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {trip.destination}
                      </p>
                    </div>
                    <StatusBadge status={trip.status} />
                  </div>

                  {/* Commitment meter */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] uppercase tracking-wide font-medium"
                        style={{ color: 'var(--text-muted)' }}>
                        Commitment
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>
                        {trip.commitment_score}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${trip.commitment_score}%`, background: 'var(--accent)' }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {trip.start_date
                        ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Dates TBD'}
                    </span>
                    <span className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>
                      View →
                    </span>
                  </div>
                </Link>

                {trip.creator_id === user.id && (
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DeleteTripButton tripId={trip.id} variant="card" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-8 sm:p-16 text-center"
            style={{ border: '1px dashed var(--border)' }}>
            <div className="text-5xl mb-4">✈️</div>
            <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-fraunces)' }}>
              No trips yet
            </h2>
            <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
              You have trips stuck in a group chat somewhere. Let's get them out.
            </p>
            <Link
              href="/plan"
              className="inline-block text-sm font-medium px-6 py-3 rounded-lg transition-colors"
              style={{ background: 'var(--accent)', color: 'var(--background)' }}
            >
              Generate my first trip →
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    planning:  { background: 'var(--accent-muted)', color: 'var(--accent-text)', border: '1px solid var(--border)' },
    locked:    { background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' },
    completed: { background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
    cancelled: { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' },
  }
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded"
      style={styles[status] || styles.planning}>
      {status}
    </span>
  )
}
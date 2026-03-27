import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  console.log('[dashboard] user.id:', user.id)

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Step 1: get all trip_ids where this user is a member
  const { data: memberRows, error: memberError } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user.id)

  console.log('[dashboard] step1 trip_members result:', { memberRows, memberError })

  const memberTripIds: string[] = memberRows?.map(r => r.trip_id) ?? []

  console.log('[dashboard] step1 memberTripIds:', memberTripIds, '| count:', memberTripIds.length)

  // Step 2: get all trips where creator_id = user OR id IN memberTripIds
  // If memberTripIds is empty, only query by creator_id to avoid empty-IN issues
  let tripsQuery = supabase
    .from('trips')
    .select('*, trip_members(count)')
    .order('created_at', { ascending: false })

  if (memberTripIds.length > 0) {
    console.log('[dashboard] step2 querying with OR: creator_id =', user.id, 'OR id IN', memberTripIds)
    tripsQuery = tripsQuery.or(`creator_id.eq.${user.id},id.in.(${memberTripIds.join(',')})`)
  } else {
    console.log('[dashboard] step2 memberTripIds is empty — querying only by creator_id:', user.id)
    tripsQuery = tripsQuery.eq('creator_id', user.id)
  }

  const { data: trips, error: tripsError } = await tripsQuery

  console.log('[dashboard] step2 trips result:', { tripsError, count: trips?.length })
  console.log('[dashboard] step2 trips detail:', trips?.map((t: any) => ({ id: t.id, title: t.title, creator_id: t.creator_id })))

  const firstName = profile?.display_name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-[#0a0a09]">

      {/* Nav */}
      <nav className="border-b border-[rgba(242,237,228,0.08)] px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-sm">
          <span className="text-[#e8623a]">Out</span>
          <span className="text-[#f2ede4]">TheChat</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#b8b0a2]">
            {profile?.display_name || user.email}
          </span>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-[#b8b0a2] hover:text-[#f2ede4] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-[#f2ede4]">
              Hey {firstName} 👋
            </h1>
            <p className="text-[#b8b0a2] mt-1 text-sm">
              {trips && trips.length > 0
                ? `You have ${trips.length} trip${trips.length > 1 ? 's' : ''} in the works`
                : "Let's get your first trip out of the chat"}
            </p>
          </div>
          <Link
            href="/plan"
            className="bg-[#e8623a] hover:bg-[#c44d28] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + New trip
          </Link>
        </div>

        {/* Trips grid */}
        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="group block bg-[#141412] border border-[rgba(242,237,228,0.08)] rounded-xl p-5 hover:border-[rgba(232,98,58,0.3)] transition-all hover:-translate-y-0.5"
              >
                {/* Trip header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-[10px] text-[#e8623a] uppercase tracking-widest mb-1">
                      {trip.duration_days} days · {trip.budget_tier}
                    </p>
                    <h3 className="text-[#f2ede4] font-medium text-base leading-tight">
                      {trip.title}
                    </h3>
                    <p className="text-[#b8b0a2] text-sm mt-0.5">{trip.destination}</p>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>

                {/* Commitment meter */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-[#b8b0a2] font-mono uppercase tracking-wide">
                      Commitment
                    </span>
                    <span className="text-[10px] text-[#e8623a] font-mono">
                      {trip.commitment_score}%
                    </span>
                  </div>
                  <div className="h-1 bg-[rgba(242,237,228,0.06)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#e8623a] rounded-full transition-all"
                      style={{ width: `${trip.commitment_score}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-[#b8b0a2]">
                    {trip.start_date
                      ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Dates TBD'}
                  </span>
                  <span className="text-xs text-[#b8b0a2] group-hover:text-[#e8623a] transition-colors">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="border border-dashed border-[rgba(242,237,228,0.12)] rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">✈️</div>
            <h2 className="text-xl font-medium text-[#f2ede4] mb-2">
              No trips yet
            </h2>
            <p className="text-[#b8b0a2] text-sm mb-8 max-w-xs mx-auto">
              You have trips stuck in a group chat somewhere. Let's get them out.
            </p>
            <Link
              href="/plan"
              className="inline-block bg-[#e8623a] hover:bg-[#c44d28] text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Generate my first trip →
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planning: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
    locked:   'bg-green-950/60 text-green-300 border-green-800/40',
    completed: 'bg-[rgba(242,237,228,0.06)] text-[#b8b0a2] border-[rgba(242,237,228,0.1)]',
    cancelled: 'bg-red-950/60 text-red-300 border-red-800/40',
  }
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${styles[status] || styles.planning}`}>
      {status}
    </span>
  )
}
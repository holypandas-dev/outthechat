import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FundDashboard } from '@/components/FundDashboard'

export default async function FundPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/trip/${id}/fund`)

  const { data: trip, error } = await supabase
    .from('trips')
    .select('id, title, destination, group_size, estimated_cost')
    .eq('id', id)
    .single()

  if (error || !trip) redirect('/dashboard')

  // Verify user is a member
  const { data: membership } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) redirect('/dashboard')

  // Fetch all members with display names
  const { data: membersRaw } = await supabase
    .from('trip_members')
    .select('user_id, profiles(display_name)')
    .eq('trip_id', id)

  const members = (membersRaw ?? []).map(m => ({
    user_id: m.user_id,
    display_name: (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles)?.display_name ?? null,
  }))

  // Fetch who has committed
  const { data: commitments } = await supabase
    .from('fund_contributions')
    .select('user_id')
    .eq('trip_id', id)
    .eq('status', 'committed')

  const committedUserIds = (commitments ?? []).map(c => c.user_id)

  // Cost per person from AI estimate
  const estimatedCost = trip.estimated_cost as Record<string, number> | null
  const costPerPerson = estimatedCost?.mid ?? 0
  const costLow = estimatedCost?.low ?? 0
  const costHigh = estimatedCost?.high ?? 0
  const groupSize = trip.group_size ?? members.length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <nav
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--background)',
          zIndex: 10,
        }}
      >
        <Link
          href="/dashboard"
          style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '14px', textDecoration: 'none' }}
        >
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </Link>
        <Link
          href={`/trip/${id}`}
          style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          ← Back to trip
        </Link>
      </nav>

      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px 80px' }}>
        <div style={{ marginBottom: '32px' }}>
          <p
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '11px',
              color: 'var(--accent)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {trip.destination}
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {trip.title}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Trip cost & commitment</p>
        </div>

        <FundDashboard
          tripId={id}
          destination={trip.destination}
          costPerPerson={costPerPerson}
          costLow={costLow}
          costHigh={costHigh}
          groupSize={groupSize}
          members={members}
          committedUserIds={committedUserIds}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}

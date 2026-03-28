import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Stripe from 'stripe'
import { FundDashboard } from '@/components/FundDashboard'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function FundPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string; cancelled?: string }>
}) {
  const { id } = await params
  const { session_id, cancelled } = await searchParams

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
  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/dashboard')

  // On successful Stripe redirect, verify the session and mark contribution as paid
  let paymentSuccess = false
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      if (session.payment_status === 'paid') {
        await supabase
          .from('fund_contributions')
          .update({ status: 'paid' })
          .eq('stripe_session_id', session_id)
        paymentSuccess = true
      }
    } catch {
      // Invalid session_id — ignore silently
    }
  }

  const { data: contributions } = await supabase
    .from('fund_contributions')
    .select('id, user_id, amount, status, created_at, profiles(display_name)')
    .eq('trip_id', id)
    .order('created_at', { ascending: false })

  // Goal = mid-range cost per person × group size, minimum $500
  const estimatedCost = trip.estimated_cost as Record<string, number> | null
  const midCost = estimatedCost?.mid ?? 0
  const goalAmount = Math.max(midCost * (trip.group_size ?? 1), 500)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a09' }}>
      <nav
        style={{
          borderBottom: '1px solid rgba(242,237,228,0.08)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: '#0a0a09',
          zIndex: 10,
        }}
      >
        <Link
          href="/dashboard"
          style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '14px', textDecoration: 'none' }}
        >
          <span style={{ color: '#e8623a' }}>Out</span>
          <span style={{ color: '#f2ede4' }}>TheChat</span>
        </Link>
        <Link
          href={`/trip/${id}`}
          style={{ fontSize: '14px', color: '#b8b0a2', textDecoration: 'none' }}
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
              color: '#e8623a',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {trip.destination}
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#f2ede4', marginBottom: '4px' }}>
            {trip.title}
          </h1>
          <p style={{ fontSize: '14px', color: '#b8b0a2' }}>Group travel fund</p>
        </div>

        {cancelled && (
          <div
            style={{
              background: 'rgba(242,237,228,0.04)',
              border: '1px solid rgba(242,237,228,0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
              fontSize: '14px',
              color: '#b8b0a2',
              marginBottom: '24px',
            }}
          >
            Payment cancelled. You can try again whenever you&apos;re ready.
          </div>
        )}

        <FundDashboard
          tripId={id}
          goalAmount={goalAmount}
          contributions={contributions ?? []}
          currentUserId={user.id}
          paymentSuccess={paymentSuccess}
        />
      </main>
    </div>
  )
}

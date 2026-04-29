import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Stripe from 'stripe'
import { UpgradeButton } from '@/components/UpgradeButton'
// UpgradeButton is a client component — imported here into the server page as an island

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string; session_id?: string; limit?: string }>
}) {
  const { success, cancelled, session_id, limit } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPremium = false
  let displayName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, display_name')
      .eq('id', user.id)
      .single()

    isPremium = profile?.is_premium ?? false
    displayName = profile?.display_name ?? null

    // On successful Stripe redirect, mark user as premium
    if (success && session_id && !isPremium) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id)
        if (session.payment_status === 'paid' || session.status === 'complete') {
          await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', user.id)
          isPremium = true
        }
      } catch {
        // Invalid session — ignore
      }
    }
  }

  const FREE_FEATURES = [
    { label: 'Up to 2 trips', included: true },
    { label: 'Group size up to 5', included: true },
    { label: 'Full AI itinerary generation', included: true },
    { label: 'Group chat & voting', included: true },
    { label: 'Map view', included: true },
    { label: 'Commitment tracker', included: true },
    { label: 'Unlimited trips', included: false },
    { label: 'Unlimited group size', included: false },
    { label: 'Export to PDF', included: false },
    { label: 'Multi-destination trips', included: false },
    { label: 'Expense splitting', included: false },
  ]

  const PREMIUM_FEATURES = [
    { label: 'Unlimited trips', included: true },
    { label: 'Unlimited group size', included: true },
    { label: 'Full AI itinerary generation', included: true },
    { label: 'Group chat & voting', included: true },
    { label: 'Map view', included: true },
    { label: 'Commitment tracker', included: true },
    { label: 'Export to PDF', included: true },
    { label: 'Multi-destination trips', included: true, soon: true },
    { label: 'Expense splitting', included: true, soon: true },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>

      {/* Nav */}
      <nav style={{
        borderBottom: '0.5px solid var(--border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'var(--background)',
        zIndex: 10,
      }}>
        <Link href="/" style={{ fontFamily: 'var(--font-fraunces)', fontSize: '15px', textDecoration: 'none' }}>
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <Link href="/dashboard" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign in</Link>
              <Link href="/signup" style={{ fontSize: '14px', fontWeight: 500, padding: '8px 18px', borderRadius: '8px', background: 'var(--text-primary)', color: 'var(--background)', textDecoration: 'none' }}>
                Get started free
              </Link>
            </>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 24px 100px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px' }}>
            Pricing
          </p>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px' }}>
            Simple, honest pricing
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.7 }}>
            Free for casual planners. Premium for groups that actually want to travel.
          </p>
        </div>

        {/* Banners */}
        {limit && !isPremium && (
          <div style={{ background: 'rgba(var(--accent-rgb),0.06)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '32px', textAlign: 'center' }}>
            You&apos;ve used your 2 free trips. Upgrade to keep planning.
          </div>
        )}
        {success && isPremium && (
          <div style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', color: '#16a34a', marginBottom: '32px', textAlign: 'center' }}>
            Welcome to Premium — you now have unlimited trips and group sizes.
          </div>
        )}
        {cancelled && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center' }}>
            No worries — you can upgrade whenever you&apos;re ready.
          </div>
        )}

        {/* Pricing cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>

          {/* Free */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '36px' }}>
            <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Free
            </p>
            <p style={{ fontSize: '40px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '6px' }}>
              $0
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Forever free, no card required
            </p>

            {!user ? (
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '11px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
                Get started free
              </Link>
            ) : (
              <div style={{ padding: '11px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                {isPremium ? 'Your previous plan' : 'Your current plan'}
              </div>
            )}

            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: f.included ? '#16a34a' : 'var(--border)', flexShrink: 0, fontWeight: 600 }}>
                    {f.included ? '✓' : '×'}
                  </span>
                  <span style={{ fontSize: '14px', color: f.included ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div style={{ background: 'var(--background)', border: '1.5px solid var(--accent)', borderRadius: '20px', padding: '36px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '36px', background: 'var(--accent)', color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px' }}>
              Premium
            </div>

            <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
              Premium
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
              <p style={{ fontSize: '40px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>$9</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/month</p>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Cancel anytime
            </p>

            {isPremium ? (
              <div style={{ padding: '11px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '8px', background: 'rgba(22,163,74,0.06)' }}>
                ✓ You&apos;re on Premium
              </div>
            ) : user ? (
              <UpgradeButton />
            ) : (
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '11px', background: 'var(--accent)', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#fff', textDecoration: 'none' }}>
                Get started →
              </Link>
            )}

            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#16a34a', flexShrink: 0, fontWeight: 600 }}>✓</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {f.label}
                    {'soon' in f && f.soon && (
                      <span style={{ fontSize: '10px', marginLeft: '6px', padding: '2px 6px', borderRadius: '4px', background: 'var(--accent-muted)', color: 'var(--accent)', fontWeight: 500, letterSpacing: '0.06em' }}>
                        Soon
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ / reassurance */}
        <div style={{ marginTop: '80px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Secure payment via Stripe · Cancel anytime · No hidden fees
          </p>
        </div>
      </main>
    </div>
  )
}


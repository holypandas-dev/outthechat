import { PrintButton } from '@/components/PrintButton'

export const metadata = {
  title: 'OutTheChat — Investor Overview',
  robots: 'noindex',
}

const FEATURES = [
  { title: 'Itinerary generator', body: 'Day-by-day trip plans built around group vibe, budget, and travel style — generated in under 15 seconds.' },
  { title: 'Group commitment tracker', body: 'Everyone sees who is in and who is wavering. One-click commit to lock in the trip.' },
  { title: 'Shared cost breakdown', body: 'Per-person cost estimates surfaced upfront. No awkward money conversations after the fact.' },
  { title: 'Affiliate booking links', body: 'Flights via airline direct links, hotels via Booking.com, experiences via Viator — embedded in every itinerary.' },
  { title: 'Group chat & voting', body: 'Built-in chat and activity voting so decisions happen inside the product, not back in WhatsApp.' },
  { title: 'Interactive trip map', body: 'Every activity pinned on a live map. Click to preview, tap to navigate.' },
]

const BUSINESS_MODEL = [
  { title: 'Affiliate commissions', body: 'Revenue share on hotel, flight, and experience bookings made through embedded affiliate links (Viator, Booking.com).' },
  { title: 'Premium subscriptions', body: '$9/month for unlimited trips, unlimited group size, PDF export, and upcoming features. Free tier capped at 3 trips, group size 5.' },
  { title: 'Transaction fees', body: 'Future: group expense splitting and in-app payment collection with a small platform fee.' },
]

export default function InvestorPage() {
  return (
    <div style={{ background: 'var(--background)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* Print bar — hidden in print */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          borderBottom: '0.5px solid var(--border)',
          background: 'var(--background)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '15px' }}>
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
          <span style={{ marginLeft: '10px', fontSize: '12px', fontFamily: 'var(--font-geist-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Investor Overview</span>
        </span>
        <PrintButton />
      </div>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '64px 32px 100px' }}>

        {/* ── HEADER ─────────────────────────────── */}
        <section style={{ marginBottom: '72px', paddingBottom: '56px', borderBottom: '0.5px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '20px' }}>
            April 2026 · Confidential
          </p>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(44px, 7vw, 72px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.0, color: 'var(--text-primary)', marginBottom: '20px' }}>
            OutTheChat
          </h1>
          <p style={{ fontSize: 'clamp(18px, 3vw, 24px)', color: 'var(--text-secondary)', fontWeight: 400, lineHeight: 1.4, maxWidth: '560px' }}>
            Get your trip out of the chat.
          </p>
          <div style={{ marginTop: '32px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {[
              { label: 'Stage', value: 'Pre-seed' },
              { label: 'Founded', value: 'April 2026' },
              { label: 'HQ', value: 'Los Angeles, CA' },
              { label: 'Model', value: 'SaaS + Affiliate' },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROBLEM ─────────────────────────────── */}
        <section style={{ marginBottom: '72px', paddingBottom: '56px', borderBottom: '0.5px solid var(--border)' }}>
          <Label>The problem</Label>
          <h2 style={h2Style}>Group trips die in group chats.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginTop: '32px' }}>
            {[
              { stat: '$11B+', label: 'Lost in unbooked group trips annually in the US' },
              { stat: '73%', label: 'Of group trip conversations never result in a booking' },
              { stat: '4.2', label: 'Average group members — too many opinions, no one decides' },
            ].map(item => (
              <div key={item.stat} style={{ padding: '24px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '12px' }}>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '36px', fontWeight: 500, color: 'var(--accent)', lineHeight: 1, marginBottom: '8px' }}>{item.stat}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.label}</p>
              </div>
            ))}
          </div>
          <p style={bodyStyle}>
            The problem is not motivation — people want to travel. The problem is coordination. Group trip planning is fragmented across WhatsApp, Google Docs, spreadsheets, and five browser tabs. No one has ownership, no one has visibility, and the trip never gets off the ground.
          </p>
        </section>

        {/* ── SOLUTION ─────────────────────────────── */}
        <section style={{ marginBottom: '72px', paddingBottom: '56px', borderBottom: '0.5px solid var(--border)' }}>
          <Label>The solution</Label>
          <h2 style={h2Style}>From group chat to booked trip — in minutes.</h2>
          <p style={bodyStyle}>
            OutTheChat is a group travel planning platform that turns a destination idea into a fully structured itinerary, shared budget, and booking-ready plan. One link replaces the chaos. The whole group sees the same plan, votes on activities, commits to the trip, and books — without leaving the platform.
          </p>
          <div style={{ marginTop: '32px', padding: '28px 32px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {['Describe', 'Generate', 'Collaborate', 'Commit', 'Book'].map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-geist-mono)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <p style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>{step}</p>
                  </div>
                  {i < 4 && <div style={{ width: '24px', height: '1px', background: 'var(--border)', marginBottom: '18px' }} />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUCT ─────────────────────────────── */}
        <section style={{ marginBottom: '72px', paddingBottom: '56px', borderBottom: '0.5px solid var(--border)' }}>
          <Label>Product</Label>
          <h2 style={h2Style}>Everything a group needs to go from idea to booked.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '32px' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: '22px 24px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{f.title}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRACTION ─────────────────────────────── */}
        <section style={{ marginBottom: '72px', paddingBottom: '56px', borderBottom: '0.5px solid var(--border)' }}>
          <Label>Traction</Label>
          <h2 style={h2Style}>Early signal.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginTop: '32px' }}>
            {[
              { stat: 'XX', label: 'Active users' },
              { stat: 'XX', label: 'Trips created' },
              { stat: 'XX', label: 'Group members invited' },
              { stat: 'Apr 2026', label: 'Launched' },
            ].map(item => (
              <div key={item.label} style={{ padding: '24px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '12px' }}>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '6px' }}>{item.stat}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</p>
              </div>
            ))}
          </div>
          <p style={{ ...bodyStyle, marginTop: '24px', fontSize: '13px' }}>
            Launched April 2026. Traction figures to be updated. Early organic growth driven by founder&apos;s travel-focused Instagram audience.
          </p>
        </section>

        {/* ── BUSINESS MODEL ─────────────────────────────── */}
        <section style={{ marginBottom: '72px', paddingBottom: '56px', borderBottom: '0.5px solid var(--border)' }}>
          <Label>Business model</Label>
          <h2 style={h2Style}>Multiple revenue streams from day one.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
            {BUSINESS_MODEL.map((item, i) => (
              <div key={item.title} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '20px 24px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }}>0{i + 1}</span>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.title}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MARKET ─────────────────────────────── */}
        <section style={{ marginBottom: '72px', paddingBottom: '56px', borderBottom: '0.5px solid var(--border)' }}>
          <Label>Market</Label>
          <h2 style={h2Style}>A large, underserved demographic.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginTop: '32px' }}>
            {[
              { stat: '$11B+', label: 'TAM — US group travel market', sub: 'Friends, family groups, bachelorette, sports travel' },
              { stat: '18–35', label: 'Primary demographic', sub: 'Mobile-first, social-first, travel-obsessed' },
              { stat: '82%', label: 'Book travel on mobile', sub: 'Product is built mobile-first from day one' },
            ].map(item => (
              <div key={item.stat} style={{ padding: '24px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '12px' }}>
                <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', fontWeight: 500, color: 'var(--accent)', lineHeight: 1, marginBottom: '6px' }}>{item.stat}</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.sub}</p>
              </div>
            ))}
          </div>
          <p style={bodyStyle}>
            Existing solutions (TripIt, Wanderlog, Google Travel) are built for solo travelers. No product owns the group travel coordination space. OutTheChat is built specifically for the moment a group says &ldquo;let&apos;s actually do this.&rdquo;
          </p>
        </section>

        {/* ── FOUNDER ─────────────────────────────── */}
        <section style={{ marginBottom: '72px', paddingBottom: '56px', borderBottom: '0.5px solid var(--border)' }}>
          <Label>Founder</Label>
          <h2 style={h2Style}>Built by the target user.</h2>
          <div style={{ marginTop: '32px', padding: '32px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '16px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Angel R.</p>
            <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '16px', fontFamily: 'var(--font-geist-mono)' }}>Solo founder · Los Angeles, CA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Solo technical founder — designed, built, and launched OutTheChat from scratch.',
                'Large travel-focused Instagram audience — direct access to the exact demographic OutTheChat serves.',
                'Target user — has personally experienced the chaos of coordinating group trips in group chats.',
                'Built the full product (Next.js, Supabase, Stripe, OpenAI, Mapbox) without external engineering resources.',
              ].map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>→</span>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ASK ─────────────────────────────── */}
        <section style={{ marginBottom: '0' }}>
          <Label>The ask</Label>
          <h2 style={h2Style}>Raising $XXX pre-seed.</h2>
          <p style={bodyStyle}>
            Funds will be used for: paid user acquisition, affiliate partnership development, premium feature buildout (expense splitting, PDF export, multi-destination), and operational costs.
          </p>
          <div style={{ marginTop: '40px', padding: '32px', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contact</p>
            <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>outthechat.vercel.app</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>officialangelrm@gmail.com</p>
          </div>
        </section>

      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 32px !important; }
        }
      `}</style>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
      {children}
    </p>
  )
}

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces)',
  fontSize: 'clamp(24px, 4vw, 36px)',
  fontWeight: 500,
  letterSpacing: '-0.02em',
  color: 'var(--text-primary)',
  lineHeight: 1.15,
  maxWidth: '600px',
}

const bodyStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text-secondary)',
  lineHeight: 1.8,
  maxWidth: '640px',
  marginTop: '20px',
}

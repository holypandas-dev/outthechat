import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <nav
        className="px-6 sm:px-10 py-5 flex items-center justify-between sticky top-0 z-10"
        style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--background)' }}
      >
        <Link href="/" style={{ fontFamily: 'var(--font-fraunces)', fontSize: '15px' }}>
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </Link>
        <Link href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← Back</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div style={{ width: '24px', height: '0.5px', background: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Legal
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '36px', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last updated: April 2026</p>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }} className="space-y-8">
          <section>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>1. What We Collect</h2>
            <p className="mb-3">We collect information you provide directly:</p>
            <ul className="space-y-1.5 pl-4">
              {['Email address and password (for account creation)', 'Display name and profile photo (optional)', 'Trip details you enter (destination, dates, preferences)', 'Payment information (processed by Stripe — we never store card numbers)'].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">We also collect usage data automatically: page views, feature interactions, and error logs to improve the Service.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>2. How We Use Your Data</h2>
            <ul className="space-y-1.5 pl-4">
              {[
                'To provide and improve the Service',
                'To generate AI trip itineraries based on your inputs',
                'To send trip-related notifications and nudges (only when you or a group member triggers them)',
                'To process payments through Stripe',
                'To respond to support requests',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>3. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="space-y-1.5 pl-4 mt-3">
              {[
                'Supabase — database and authentication infrastructure',
                'OpenAI — trip generation (your trip inputs are sent to generate itineraries)',
                'Stripe — payment processing',
                'Resend — transactional email delivery',
                'Unsplash — destination photo search',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by emailing <a href="mailto:support@outthechat.com" style={{ color: 'var(--accent)' }}>support@outthechat.com</a>. Trip data shared with group members may persist until those members also request deletion.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>5. Cookies</h2>
            <p>We use cookies and local storage for authentication sessions and theme preferences. We do not use third-party tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>6. Your Rights</h2>
            <p>Depending on your location, you may have the right to access, correct, or delete your personal data, and to object to or restrict certain processing. To exercise these rights, contact us at <a href="mailto:support@outthechat.com" style={{ color: 'var(--accent)' }}>support@outthechat.com</a>.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>7. Security</h2>
            <p>We use industry-standard security practices including encrypted connections (HTTPS), hashed passwords via Supabase Auth, and row-level security on our database. No system is perfectly secure — please use a strong, unique password.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>8. Contact</h2>
            <p>Privacy questions? Email <a href="mailto:support@outthechat.com" style={{ color: 'var(--accent)' }}>support@outthechat.com</a>.</p>
          </section>
        </div>
      </main>

      <footer className="px-6 sm:px-10 py-8 flex items-center justify-between" style={{ borderTop: '0.5px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2026 OutTheChat</p>
        <Link href="/terms" className="text-xs" style={{ color: 'var(--text-secondary)' }}>Terms of Service</Link>
      </footer>
    </div>
  )
}

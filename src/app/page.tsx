import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ background: 'var(--background)', color: 'var(--text-primary)' }} className="min-h-screen">

      {/* Nav */}
      <nav
        className="px-6 sm:px-10 py-5 flex items-center justify-between sticky top-0 z-10"
        style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--background)' }}
      >
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '15px', letterSpacing: '-0.01em' }}>
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </span>
        <div className="flex items-center gap-8">
          <div className="hidden sm:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>How it works</a>
            <a href="#features" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Features</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
              Sign in
            </Link>
            <Link
              href="/join"
              className="text-sm font-medium px-5 py-2 rounded-md transition-colors"
              style={{ background: 'var(--text-primary)', color: 'var(--background)' }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 sm:px-10 pt-24 pb-20 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div style={{ width: '32px', height: '0.5px', background: 'var(--accent)' }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            AI-powered group travel planning
          </span>
        </div>
        <h1
          className="font-medium mb-8"
          style={{
            fontFamily: 'var(--font-fraunces)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            maxWidth: '720px',
            lineHeight: '1.06',
            fontSize: 'clamp(38px, 6vw, 60px)',
          }}
        >
          Your group trip is still<br />
          in the chat.<br />
          <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Let&apos;s fix that.</em>
        </h1>
        <p
          className="text-base sm:text-lg leading-relaxed mb-10"
          style={{ color: 'var(--text-secondary)', maxWidth: '480px' }}
        >
          OutTheChat turns messy group conversations into real, fully planned trips — itineraries, budgets, bookings, and everyone actually committed.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Link
            href="/join"
            className="text-sm font-medium px-7 py-3.5 rounded-md transition-colors"
            style={{ background: 'var(--text-primary)', color: 'var(--background)' }}
          >
            Plan my trip for free →
          </Link>
          
            <a href="#how-it-works"
            className="text-sm transition-colors"
            style={{ color: 'var(--text-secondary)', borderBottom: '0.5px solid var(--accent)', paddingBottom: '1px' }}
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Marquee */}
      <div style={{ borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)', background: 'var(--surface)', overflow: 'hidden', padding: '14px 0' }}>
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: 'marquee 24s linear infinite' }}
        >
          {[
            'AI Itineraries', 'Group Budgets', 'Flight Search', 'Hotel Booking',
            'Excursions', 'Commitment Tracker', 'Trip Maps', 'Group Chat',
            'AI Itineraries', 'Group Budgets', 'Flight Search', 'Hotel Booking',
            'Excursions', 'Commitment Tracker', 'Trip Maps', 'Group Chat',
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {item}
              </span>
              <span style={{ color: 'var(--accent)', fontSize: '10px' }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Problem */}
      <section className="px-6 sm:px-10 py-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-16 sm:gap-24 items-start">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: '24px', height: '0.5px', background: 'var(--accent)' }} />
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                The problem
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl font-medium mb-5"
              style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: '1.15' }}
            >
              Group trips die in group chats.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              Someone says &quot;we should go to Tulum&quot; and 47 messages later nothing&apos;s decided, half the group dropped off, and nobody booked anything. The problem isn&apos;t your group — it&apos;s that there&apos;s nowhere to actually plan.
            </p>
          </div>
          <div style={{ borderLeft: '0.5px solid var(--border)' }}>
            {[
              { num: '01', title: 'Lost in the thread', body: 'Ideas buried under memes and off-topic tangents. Nobody can find what was actually decided.' },
              { num: '02', title: 'Money gets awkward', body: "Nobody knows what things cost until it's too late. Someone always ends up footing the bill." },
              { num: '03', title: 'Half the group flakes', body: "Without real commitment, trips stay hypothetical forever. Tulum 2022 is now Tulum 2026." },
            ].map((item, i) => (
              <div
                key={i}
                className="pl-7 py-6"
                style={{ borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none' }}
              >
                <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
                  {item.num}
                </p>
                <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ background: 'var(--foreground)' }} className="px-6 sm:px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div style={{ width: '24px', height: '0.5px', background: 'var(--accent)' }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              How it works
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-medium mb-14"
            style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--background)', letterSpacing: '-0.02em', lineHeight: '1.15' }}
          >
            From idea to itinerary in minutes.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5">
            {[
              { step: '01 — Describe', title: 'Tell the AI where you want to go', body: 'Destination, vibe, budget, group size. The more detail, the better the plan.' },
              { step: '02 — Generate', title: 'Get a full itinerary instantly', body: 'Day-by-day plans, activities, estimated costs, flights and hotels — all in seconds.' },
              { step: '03 — Commit', title: 'Invite your group & lock it in', body: "Everyone votes, commits funds, and the trip actually happens." },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8"
                style={{
                  background: 'var(--surface)',
                  borderRadius: i === 0 ? '10px 0 0 10px' : i === 2 ? '0 10px 10px 0' : '0',
                }}
              >
                <p className="text-xs font-medium uppercase tracking-widest mb-5" style={{ color: 'var(--accent)' }}>
                  {item.step}
                </p>
                <p
                  className="text-base font-medium mb-3"
                  style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text-primary)', lineHeight: '1.3' }}
                >
                  {item.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 sm:px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div style={{ width: '24px', height: '0.5px', background: 'var(--accent)' }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Features
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-medium mb-14"
            style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: '1.15' }}
          >
            One place for the whole trip.
          </h2>
          <div
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{ border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}
          >
            {[
              { title: 'AI itinerary generator', body: "Full day-by-day plans built around your group's vibe, budget, and travel style.", soon: false },
              { title: 'Flight search', body: 'Find and compare flights for your whole group without leaving the app.', soon: true },
              { title: 'Hotel & stay booking', body: 'Browse stays that fit your budget and group size, all in one place.', soon: true },
              { title: 'Excursions & activities', body: 'Book tours and experiences directly through OutTheChat.', soon: true },
              { title: 'Shared trip budget', body: 'Everyone sees costs upfront. No surprises, no awkward money conversations.', soon: false },
              { title: 'Group commitment tracker', body: "See who's in, who's wavering, and nudge everyone to lock it in.", soon: false },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8"
                style={{
                  background: 'var(--background)',
                  borderRight: i % 2 === 0 ? '0.5px solid var(--border)' : 'none',
                  borderBottom: i < 4 ? '0.5px solid var(--border)' : 'none',
                }}
              >
                {item.soon && (
                  <span
                    className="inline-block text-xs font-medium px-2 py-0.5 rounded mb-3 uppercase tracking-wide"
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)' }}
                  >
                    Coming soon
                  </span>
                )}
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="px-6 sm:px-10 py-24 text-center"
        style={{ borderTop: '0.5px solid var(--border)' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div style={{ width: '24px', height: '0.5px', background: 'var(--accent)' }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Get started
            </span>
            <div style={{ width: '24px', height: '0.5px', background: 'var(--accent)' }} />
          </div>
          <h2
            className="font-medium mb-6"
            style={{
              fontFamily: 'var(--font-fraunces)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
              fontSize: 'clamp(32px, 5vw, 48px)',
            }}
          >
            Your next trip is one<br />
            conversation{' '}
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>away.</em>
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
            Stop planning in group chats. Start planning in OutTheChat.
          </p>
          <Link
            href="/join"
            className="inline-block text-sm font-medium px-10 py-4 rounded-md transition-colors"
            style={{ background: 'var(--text-primary)', color: 'var(--background)' }}
          >
            Plan my trip for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: '0.5px solid var(--border)' }}
      >
        <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '15px' }}>
          <span style={{ color: 'var(--accent)' }}>Out</span>
          <span style={{ color: 'var(--text-primary)' }}>TheChat</span>
        </span>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2026 OutTheChat. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/login" className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }}>Sign in</Link>
          <Link href="/join" className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }}>Sign up</Link>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

    </div>
  )
}
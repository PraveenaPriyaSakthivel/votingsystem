import { Link } from 'react-router-dom'
import { Zap, Share2, Users, BarChart2, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #4A2E21 0%, #5A3A2E 50%, #4A2E21 100%)',
        }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(184,230,163,0.07) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto animate-slide-up">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full"
              style={{
                background: 'rgba(184,230,163,0.12)',
                border: '1px solid rgba(184,230,163,0.3)',
                color: '#B8E6A3',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                style={{ background: '#8FD17A' }}
              />
              Real-time results · No refresh needed
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight tracking-tight mb-5"
            style={{ color: '#F5F1E8' }}
          >
            Polls that update{' '}
            <span style={{ color: '#B8E6A3' }}>instantly</span>
          </h1>

          <p
            className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8"
            style={{ color: '#D8CFC5' }}
          >
            Create a poll, share the link, watch votes roll in live. Built for
            classrooms, meetups, and audiences of any size.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/create" className="btn btn-primary btn-xl">
                  Create a poll
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/dashboard" className="btn btn-ghost btn-xl">
                  My dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary btn-xl">
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn btn-ghost btn-xl">
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-10">
            {['No credit card required', 'Live Redis-powered updates', 'Open in seconds'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs" style={{ color: '#BDAFA4' }}>
                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#8FD17A' }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20 px-4"
        style={{ background: '#4A2E21', borderTop: '1px solid #9A705B' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-2xl sm:text-3xl font-display font-bold mb-3"
              style={{ color: '#F5F1E8' }}
            >
              Three steps, live results
            </h2>
            <p className="text-sm" style={{ color: '#BDAFA4' }}>
              The whole flow from creation to live updates takes under a minute.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Create',
                desc: 'Sign in and build your poll with up to 10 options in seconds.',
                icon: <BarChart2 className="w-5 h-5" />,
              },
              {
                num: '02',
                title: 'Share',
                desc: 'Copy one link and send it anywhere — no account needed to vote.',
                icon: <Share2 className="w-5 h-5" />,
              },
              {
                num: '03',
                title: 'Watch',
                desc: 'Every vote pushes a live update to all watching screens instantly.',
                icon: <Zap className="w-5 h-5" />,
              },
            ].map((step) => (
              <div
                key={step.num}
                className="card p-6 flex flex-col gap-4 card-hover"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(184,230,163,0.15)', color: '#B8E6A3' }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="text-3xl font-display font-extrabold tabular-nums"
                    style={{ color: 'rgba(184,230,163,0.15)' }}
                  >
                    {step.num}
                  </span>
                </div>
                <div>
                  <h3
                    className="font-display font-bold text-base mb-1"
                    style={{ color: '#F5F1E8' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#BDAFA4' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20 px-4"
        style={{ background: '#5A3A2E', borderTop: '1px solid #9A705B' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-2xl sm:text-3xl font-display font-bold mb-3"
              style={{ color: '#F5F1E8' }}
            >
              Everything you need
            </h2>
            <p className="text-sm" style={{ color: '#BDAFA4' }}>
              Purpose-built features without the complexity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: <Zap className="w-4 h-4" />,
                title: 'Truly real-time',
                desc: 'Redis pub/sub pushes every vote to all connected browsers via Server-Sent Events — zero polling, zero refresh.',
              },
              {
                icon: <Share2 className="w-4 h-4" />,
                title: 'One-click sharing',
                desc: 'Every poll gets a unique link. Voters don\'t need an account — just open and vote.',
              },
              {
                icon: <Users className="w-4 h-4" />,
                title: 'Multiple-choice support',
                desc: 'Toggle on multi-select when you need richer audience feedback beyond a single pick.',
              },
              {
                icon: <BarChart2 className="w-4 h-4" />,
                title: 'Live animated results',
                desc: 'Smooth progress bars update in real time. The leading option is always clearly highlighted.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card-lt p-5 flex gap-4 card-hover"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(184,230,163,0.15)', color: '#B8E6A3' }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3
                    className="font-semibold text-sm mb-1"
                    style={{ color: '#F5F1E8' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#BDAFA4' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section
          className="py-16 px-4 text-center"
          style={{ background: '#4A2E21', borderTop: '1px solid #9A705B' }}
        >
          <div className="max-w-xl mx-auto">
            <h2
              className="text-2xl sm:text-3xl font-display font-bold mb-3"
              style={{ color: '#F5F1E8' }}
            >
              Ready to run your first live poll?
            </h2>
            <p className="text-sm mb-8" style={{ color: '#BDAFA4' }}>
              Sign up free — no credit card, no setup. Live in under a minute.
            </p>
            <Link to="/signup" className="btn btn-primary btn-xl">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer
        className="py-6 px-4 text-center"
        style={{ background: '#4A2E21', borderTop: '1px solid #9A705B' }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: '#B8E6A3' }}
          >
            <BarChart2 className="w-3 h-3" style={{ color: '#3A2319' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#F5F1E8' }}>LivePoll</span>
        </div>
        <p className="text-xs" style={{ color: '#9A705B' }}>
          React · Go · MongoDB · Redis · Server-Sent Events
        </p>
      </footer>
    </div>
  )
}

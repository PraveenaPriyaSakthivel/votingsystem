import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle, ExternalLink, Trash2, ToggleLeft, ToggleRight,
  BarChart2, Clock, Users, Copy, CheckCircle2, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyPolls, setActive, deletePoll } from '../api/polls'
import { useAuth } from '../context/AuthContext'
import type { Poll } from '../types'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const { user } = useAuth()
  const [polls, setPolls]         = useState<Poll[]>([])
  const [loading, setLoading]     = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [copiedId, setCopiedId]   = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setPolls(await getMyPolls())
    } catch {
      toast.error('Failed to load polls')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (poll: Poll) => {
    setTogglingId(poll.id)
    try {
      await setActive(poll.id, !poll.is_active)
      setPolls(prev => prev.map(p => p.id === poll.id ? { ...p, is_active: !p.is_active } : p))
      toast.success(poll.is_active ? 'Poll closed' : 'Poll opened')
    } catch {
      toast.error('Failed to update poll')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this poll and all its votes? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deletePoll(id)
      setPolls(prev => prev.filter(p => p.id !== id))
      toast.success('Poll deleted')
    } catch {
      toast.error('Failed to delete poll')
    } finally {
      setDeletingId(null)
    }
  }

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/poll/${id}`)
    setCopiedId(id)
    toast.success('Link copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  /* ── Stats ── */
  const totalPolls  = polls.length
  const activePolls = polls.filter(p => p.is_active && !(p.ends_at && new Date(p.ends_at) < new Date())).length
  const totalVotes  = polls.reduce((sum, p) => sum + p.total_votes, 0)

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] py-10 px-4" style={{ background: '#5A3A2E' }}>
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 rounded-xl mb-8" style={{ background: '#745041' }} />
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 rounded-2xl" style={{ background: '#745041' }} />
            ))}
          </div>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-28 rounded-2xl" style={{ background: '#745041' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-10 px-4" style={{ background: '#5A3A2E' }}>
      <div className="max-w-5xl mx-auto animate-slide-up">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold" style={{ color: '#F5F1E8' }}>
              Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#BDAFA4' }}>
              Welcome back, <span style={{ color: '#D8CFC5' }}>{user?.username}</span>
            </p>
          </div>
          <Link to="/create" className="btn btn-primary btn-md">
            <PlusCircle className="w-4 h-4" />
            New poll
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Polls',   value: totalPolls,  icon: <BarChart2 className="w-5 h-5" /> },
            { label: 'Active Polls',  value: activePolls, icon: <ToggleRight className="w-5 h-5" /> },
            { label: 'Total Votes',   value: totalVotes,  icon: <Users className="w-5 h-5" /> },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{
                background: '#745041',
                border: '1px solid #9A705B',
                boxShadow: '0 2px 8px rgba(58,35,25,0.25)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(184,230,163,0.15)', color: '#B8E6A3' }}
              >
                {stat.icon}
              </div>
              <div>
                <p
                  className="text-2xl font-display font-bold tabular-nums"
                  style={{ color: '#B8E6A3' }}
                >
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#BDAFA4' }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Poll list ── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: '#D8CFC5' }}>
            Your polls
            <span className="ml-2 text-xs font-normal" style={{ color: '#9A705B' }}>
              ({totalPolls})
            </span>
          </h2>
        </div>

        {/* Empty state */}
        {polls.length === 0 && (
          <div
            className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
            style={{
              background: '#745041',
              border: '1px dashed #9A705B',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(184,230,163,0.12)', color: '#B8E6A3' }}
            >
              <BarChart2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base mb-1" style={{ color: '#F5F1E8' }}>
                No polls yet
              </h3>
              <p className="text-sm" style={{ color: '#BDAFA4' }}>
                Create your first poll and share it with your audience.
              </p>
            </div>
            <Link to="/create" className="btn btn-primary btn-md">
              <PlusCircle className="w-4 h-4" />
              Create your first poll
            </Link>
          </div>
        )}

        {/* Poll cards */}
        <div className="space-y-4">
          {polls.map(poll => {
            const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false
            const isActive  = poll.is_active && !isExpired

            return (
              <div
                key={poll.id}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: '#745041',
                  border: '1px solid #9A705B',
                  boxShadow: '0 2px 8px rgba(58,35,25,0.2)',
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3
                        className="font-display font-semibold text-base truncate"
                        style={{ color: '#F5F1E8' }}
                      >
                        {poll.title}
                      </h3>
                      {isExpired
                        ? <span className="badge-red flex-shrink-0">Expired</span>
                        : isActive
                          ? <span className="badge-green flex-shrink-0">
                              <span
                                className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                                style={{ background: '#8FD17A' }}
                              />
                              Active
                            </span>
                          : <span className="badge-muted flex-shrink-0">Closed</span>
                      }
                    </div>
                    {poll.description && (
                      <p
                        className="text-sm truncate"
                        style={{ color: '#BDAFA4' }}
                        title={poll.description}
                      >
                        {poll.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div
                  className="flex items-center gap-4 flex-wrap py-3 text-xs"
                  style={{ borderTop: '1px solid rgba(154,112,91,0.4)', color: '#BDAFA4' }}
                >
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" style={{ color: '#B8E6A3' }} />
                    <strong style={{ color: '#B8E6A3' }}>{poll.total_votes.toLocaleString()}</strong>
                    &nbsp;votes
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5" />
                    {poll.options.length} options
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
                  </span>
                  {poll.ends_at && (
                    <span
                      className="flex items-center gap-1"
                      style={{ color: isExpired ? '#E98B82' : '#E6C77A' }}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {isExpired
                        ? `Ended ${formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}`
                        : `Closes ${formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}`}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <Link
                    to={`/poll/${poll.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </Link>

                  <button
                    onClick={() => copyLink(poll.id)}
                    className="btn btn-ghost btn-sm"
                  >
                    {copiedId === poll.id
                      ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#8FD17A' }} />
                      : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === poll.id ? 'Copied!' : 'Copy link'}
                  </button>

                  {!isExpired && (
                    <button
                      onClick={() => handleToggle(poll)}
                      disabled={togglingId === poll.id}
                      className="btn btn-ghost btn-sm"
                      style={{ color: isActive ? '#E6C77A' : '#8FD17A' }}
                    >
                      {togglingId === poll.id ? (
                        <span
                          className="w-3.5 h-3.5 rounded-full border-2 animate-spin-slow"
                          style={{ borderColor: '#9A705B', borderTopColor: '#B8E6A3' }}
                          aria-hidden
                        />
                      ) : isActive ? (
                        <ToggleRight className="w-3.5 h-3.5" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                      {isActive ? 'Close poll' : 'Open poll'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(poll.id)}
                    disabled={deletingId === poll.id}
                    className="btn btn-danger btn-sm ml-auto"
                  >
                    {deletingId === poll.id ? (
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2 animate-spin-slow"
                        style={{ borderColor: '#E98B82', borderTopColor: 'transparent' }}
                        aria-hidden
                      />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    {deletingId === poll.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

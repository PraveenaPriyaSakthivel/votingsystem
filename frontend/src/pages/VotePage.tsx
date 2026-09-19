import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Copy, CheckCircle2, Clock, Share2, BarChart2,
  Users, AlertCircle, ArrowLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getPoll, votePoll, checkVoted } from '../api/polls'
import { useLiveResults } from '../hooks/useLiveResults'
import { useFingerprint } from '../hooks/useFingerprint'
import ResultBar from '../components/ResultBar'
import LiveBadge from '../components/LiveBadge'
import type { Poll } from '../types'
import { formatDistanceToNow } from 'date-fns'

export default function VotePage() {
  const { id } = useParams<{ id: string }>()
  useFingerprint()

  const [poll, setPoll]           = useState<Poll | null>(null)
  const [loadingPoll, setLoading] = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [selected, setSelected]   = useState<string[]>([])
  const [hasVoted, setHasVoted]   = useState(false)
  const [voting, setVoting]       = useState(false)
  const [copied, setCopied]       = useState(false)

  const { result, connected } = useLiveResults(id)

  /* fetch poll + vote status */
  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getPoll(id), checkVoted(id)])
      .then(([p, voted]) => { setPoll(p); setHasVoted(voted) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const toggleOption = (optId: string) => {
    if (!poll || hasVoted) return
    setSelected(prev =>
      poll.allow_multiple
        ? prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]
        : [optId]
    )
  }

  const handleVote = useCallback(async () => {
    if (!id || selected.length === 0) return
    setVoting(true)
    try {
      await votePoll(id, selected)
      setHasVoted(true)
      toast.success('Vote submitted!')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to submit vote'
      if (msg.includes('already voted')) setHasVoted(true)
      toast.error(msg)
    } finally {
      setVoting(false)
    }
  }, [id, selected])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── loading ── */
  if (loadingPoll) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-full border-4 animate-spin-slow"
            style={{ borderColor: '#9A705B', borderTopColor: '#B8E6A3' }}
          />
          <p className="text-sm" style={{ color: '#BDAFA4' }}>Loading poll…</p>
        </div>
      </div>
    )
  }

  /* ── not found ── */
  if (notFound || !poll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(233,139,130,0.15)', border: '1px solid rgba(233,139,130,0.3)' }}
        >
          <AlertCircle className="w-7 h-7" style={{ color: '#E98B82' }} />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold mb-1" style={{ color: '#F5F1E8' }}>
            Poll not found
          </h2>
          <p className="text-sm" style={{ color: '#BDAFA4' }}>
            This poll may have been deleted or the link is incorrect.
          </p>
        </div>
        <Link to="/" className="btn btn-ghost btn-md">
          <ArrowLeft className="w-4 h-4" />
          Go home
        </Link>
      </div>
    )
  }

  const isPollClosed =
    !poll.is_active || (poll.ends_at ? new Date(poll.ends_at) < new Date() : false)

  /* merge live Redis counts into display options */
  const displayOptions = poll.options.map(opt => {
    const live = result?.options.find(o => o.id === opt.id)
    if (live) return live
    const total = poll.total_votes
    return {
      id: opt.id,
      text: opt.text,
      votes: opt.votes,
      percentage: total > 0 ? (opt.votes / total) * 100 : 0,
    }
  })

  const totalVotes = result?.total_votes ?? poll.total_votes
  const maxVotes   = Math.max(...displayOptions.map(o => o.votes), 0)
  const showResults = hasVoted || isPollClosed

  /* sort results by votes descending */
  const sortedResults = showResults
    ? [...displayOptions].sort((a, b) => b.votes - a.votes)
    : null

  return (
    <div
      className="min-h-[calc(100vh-64px)] py-8 px-4"
      style={{ background: '#5A3A2E' }}
    >
      <div className="max-w-xl mx-auto animate-slide-up">

        {/* ── Poll header card ── */}
        <div
          className="rounded-2xl p-6 mb-5"
          style={{
            background: '#745041',
            border: '1px solid #9A705B',
            boxShadow: '0 4px 16px rgba(58,35,25,0.35)',
          }}
        >
          {/* top row: status badges + share */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <LiveBadge connected={connected} />
              {isPollClosed && (
                <span className="badge-red">
                  <Clock className="w-3 h-3" /> Closed
                </span>
              )}
              {poll.allow_multiple && !showResults && (
                <span className="badge-muted">
                  <Users className="w-3 h-3" /> Multiple choice
                </span>
              )}
            </div>
            <button
              onClick={copyLink}
              className="btn btn-ghost btn-sm flex-shrink-0"
              title="Copy poll link"
            >
              {copied
                ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#8FD17A' }} />
                : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>

          {/* title */}
          <h1
            className="text-xl sm:text-2xl font-display font-bold leading-snug mb-2"
            style={{ color: '#F5F1E8' }}
          >
            {poll.title}
          </h1>

          {poll.description && (
            <p className="text-sm leading-relaxed mb-3" style={{ color: '#D8CFC5' }}>
              {poll.description}
            </p>
          )}

          {/* meta row */}
          <div
            className="flex items-center gap-3 flex-wrap pt-3 text-xs"
            style={{ borderTop: '1px solid #9A705B', color: '#BDAFA4' }}
          >
            <span>by <strong style={{ color: '#D8CFC5' }}>{poll.creator_name}</strong></span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}</span>
            {poll.ends_at && !isPollClosed && (
              <>
                <span>·</span>
                <span style={{ color: '#E6C77A' }}>
                  Closes {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}
                </span>
              </>
            )}
            {poll.ends_at && isPollClosed && (
              <>
                <span>·</span>
                <span style={{ color: '#E98B82' }}>
                  Ended {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}
                </span>
              </>
            )}
          </div>

          {/* vote count */}
          <div
            className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(58,35,25,0.35)', border: '1px solid #9A705B' }}
          >
            <BarChart2 className="w-4 h-4 flex-shrink-0" style={{ color: '#B8E6A3' }} />
            <span
              className="text-xl font-display font-bold tabular-nums"
              key={totalVotes}
              style={{ color: '#B8E6A3' }}
            >
              {totalVotes.toLocaleString()}
            </span>
            <span className="text-sm" style={{ color: '#BDAFA4' }}>
              {totalVotes === 1 ? 'vote' : 'votes'} cast
            </span>
          </div>
        </div>

        {/* ── Options (voting) ── */}
        {!showResults && !isPollClosed && (
          <div className="space-y-3 mb-5">
            {displayOptions.map(opt => {
              const chosen = selected.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className="w-full text-left rounded-xl px-4 py-3.5 transition-all duration-150"
                  style={{
                    background: chosen
                      ? 'linear-gradient(135deg, rgba(184,230,163,0.12), rgba(116,80,65,0.6))'
                      : 'rgba(107,71,56,0.55)',
                    border: chosen
                      ? '1.5px solid rgba(184,230,163,0.5)'
                      : '1.5px solid #9A705B',
                    boxShadow: chosen ? '0 0 0 3px rgba(184,230,163,0.12)' : 'none',
                    transform: chosen ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* checkbox/radio indicator */}
                    <span
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all"
                      style={{
                        borderRadius: poll.allow_multiple ? '5px' : '50%',
                        border: `2px solid ${chosen ? '#B8E6A3' : '#9A705B'}`,
                        background: chosen ? '#B8E6A3' : 'transparent',
                      }}
                      aria-hidden
                    >
                      {chosen && (
                        <CheckCircle2
                          className="w-3 h-3"
                          style={{ color: '#3A2319', strokeWidth: 3 }}
                        />
                      )}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: chosen ? '#C8F7B5' : '#F5F1E8' }}
                    >
                      {opt.text}
                    </span>
                  </div>
                </button>
              )
            })}

            {/* vote button */}
            <button
              onClick={handleVote}
              disabled={selected.length === 0 || voting}
              className="btn btn-primary btn-lg w-full mt-2"
            >
              {voting ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin-slow"
                    style={{ borderColor: '#3A2319', borderTopColor: 'transparent' }}
                    aria-hidden
                  />
                  Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {selected.length > 0
                    ? `Submit ${selected.length} vote${selected.length > 1 ? 's' : ''}`
                    : 'Select an option to vote'}
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {showResults && (
          <div className="space-y-3 mb-5">
            {(sortedResults ?? displayOptions).map((opt, rank) => (
              <ResultBar
                key={opt.id}
                option={opt}
                isWinner={opt.votes === maxVotes && maxVotes > 0}
                isSelected={selected.includes(opt.id)}
                totalVotes={totalVotes}
                rank={rank}
              />
            ))}
          </div>
        )}

        {/* ── Voted confirmation ── */}
        {hasVoted && (
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-5 text-sm"
            style={{
              background: 'rgba(143,209,122,0.1)',
              border: '1px solid rgba(143,209,122,0.3)',
              color: '#B8E6A3',
            }}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#8FD17A' }} />
            <p>
              Your vote has been recorded. Results update live as new votes come in — no
              refresh needed.
            </p>
          </div>
        )}

        {/* ── Share panel ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#745041', border: '1px solid #9A705B' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4" style={{ color: '#B8E6A3' }} />
            <span className="text-sm font-semibold" style={{ color: '#F5F1E8' }}>
              Share this poll
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={window.location.href}
              className="input flex-1 text-xs py-2"
              style={{ cursor: 'text', background: 'rgba(58,35,25,0.4)' }}
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copyLink}
              className="btn btn-primary btn-sm flex-shrink-0"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

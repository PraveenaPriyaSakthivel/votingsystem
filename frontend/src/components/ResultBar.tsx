import { useEffect, useRef } from 'react'
import type { OptionResult } from '../types'

interface Props {
  option: OptionResult
  isWinner: boolean
  isSelected: boolean
  totalVotes: number
  rank?: number
}

export default function ResultBar({ option, isWinner, isSelected, totalVotes, rank = 0 }: Props) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--bar-pct', `${option.percentage}%`)
      // Smooth width transition driven inline so it fires on every update
      barRef.current.style.width = `${option.percentage}%`
    }
  }, [option.percentage])

  // Leading option gets the brightest green; others fade slightly
  const barColor = isWinner && totalVotes > 0 ? '#B8E6A3' : rank === 1 ? '#8FD17A' : '#6FA862'

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        background: isWinner && totalVotes > 0
          ? 'linear-gradient(135deg, rgba(184,230,163,0.1), rgba(116,80,65,0.6))'
          : 'rgba(107,71,56,0.5)',
        border: `1.5px solid ${isWinner && totalVotes > 0 ? 'rgba(184,230,163,0.4)' : '#9A705B'}`,
        outline: isSelected ? '2px solid rgba(184,230,163,0.5)' : 'none',
        outlineOffset: '2px',
      }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-2.5 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {isWinner && totalVotes > 0 && (
            <span className="text-sm flex-shrink-0" title="Leading">🏆</span>
          )}
          <span
            className="text-sm font-medium truncate"
            style={{ color: isWinner && totalVotes > 0 ? '#C8F7B5' : '#F5F1E8' }}
          >
            {option.text}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-sm font-bold tabular-nums animate-count-update"
            key={option.votes}
            style={{ color: '#B8E6A3' }}
          >
            {option.votes.toLocaleString()}
          </span>
          <span className="text-xs" style={{ color: '#BDAFA4' }}>
            votes
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(58,35,25,0.5)', border: '1px solid rgba(154,112,91,0.3)' }}
        role="progressbar"
        aria-valuenow={option.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${option.text}: ${option.percentage.toFixed(1)}%`}
      >
        <div
          ref={barRef}
          style={{
            width: `${option.percentage}%`,
            background: `linear-gradient(90deg, ${barColor}aa, ${barColor})`,
            height: '100%',
            borderRadius: '9999px',
            transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: isWinner && totalVotes > 0 ? `0 0 8px ${barColor}66` : 'none',
          }}
        />
      </div>

      {/* Percentage */}
      <div className="mt-1.5 text-right">
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color: isWinner && totalVotes > 0 ? '#B8E6A3' : '#BDAFA4' }}
        >
          {option.percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

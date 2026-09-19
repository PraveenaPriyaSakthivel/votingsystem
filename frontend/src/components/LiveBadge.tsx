interface Props {
  connected: boolean
}

export default function LiveBadge({ connected }: Props) {
  if (connected) {
    return (
      <span className="badge-green inline-flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full animate-pulse-dot"
          style={{ background: '#8FD17A', boxShadow: '0 0 6px rgba(143,209,122,0.6)' }}
        />
        Live
      </span>
    )
  }

  return (
    <span className="badge-muted inline-flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: '#9A705B' }}
      />
      Reconnecting…
    </span>
  )
}

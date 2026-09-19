import { useState, useEffect, useRef } from 'react'
import type { PollResult } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

/**
 * useLiveResults subscribes to the SSE stream for a poll and returns the
 * latest PollResult. The EventSource is automatically closed on unmount or
 * when pollId changes.
 */
export function useLiveResults(pollId: string | undefined) {
  const [result, setResult] = useState<PollResult | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!pollId) return

    // Close any previous connection.
    if (esRef.current) {
      esRef.current.close()
    }

    const url = `${BASE_URL}/api/polls/${pollId}/stream`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => {
      setConnected(true)
      setError(null)
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as PollResult
        setResult(data)
      } catch {
        // Ignore malformed frames (e.g. heartbeat comments are filtered by browser).
      }
    }

    es.onerror = () => {
      setConnected(false)
      setError('Lost connection — reconnecting...')
      // Browser auto-reconnects EventSource; just update UI state.
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [pollId])

  return { result, connected, error }
}

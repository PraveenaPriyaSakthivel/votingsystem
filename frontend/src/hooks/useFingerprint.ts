import { useEffect, useState } from 'react'

const STORAGE_KEY = 'lp_fp'

/**
 * useFingerprint returns a stable browser fingerprint stored in localStorage.
 * This is sent as the X-Voter-Fingerprint header to identify voters without
 * requiring an account. It's not cryptographically secure — just a best-effort
 * anti-double-vote mechanism for anonymous voters.
 */
export function useFingerprint(): string {
  const [fp, setFp] = useState<string>('')

  useEffect(() => {
    let stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Generate a random 128-bit identifier.
      const arr = new Uint8Array(16)
      crypto.getRandomValues(arr)
      stored = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem(STORAGE_KEY, stored)
    }
    setFp(stored)

    // Attach to axios default headers so every vote request carries it.
    // We import dynamically to avoid circular deps.
    import('../api/client').then(({ apiClient }) => {
      apiClient.defaults.headers.common['X-Voter-Fingerprint'] = stored!
    })
  }, [])

  return fp
}

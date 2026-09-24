import { useEffect, useRef } from 'react'

/**
 * Calls `callback` every `intervalMs` while the tab is visible.
 * - Pauses while `document.hidden` and fires immediately when the tab becomes visible again.
 * - Never overlaps: a tick is skipped while the previous call is still running.
 * - Always calls the latest `callback` without restarting the timer.
 */
export default function useVisibilityPolling(callback, intervalMs, { enabled = true } = {}) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return undefined
    let timer = null
    let running = false

    const tick = async () => {
      if (running || document.hidden) return
      running = true
      try {
        await callbackRef.current()
      } catch {
        /* the callback reports its own errors */
      } finally {
        running = false
      }
    }

    const start = () => {
      if (timer == null) timer = window.setInterval(tick, intervalMs)
    }
    const stop = () => {
      if (timer != null) window.clearInterval(timer)
      timer = null
    }

    const onVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        tick()
        start()
      }
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs, enabled])
}

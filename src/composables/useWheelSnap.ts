/**
 * Wheel-driven "screen by screen" scrolling for the user page.
 *
 * The page snaps between an explicit list of scroll offsets ("stops") rather than
 * between arbitrary sections, because the wanted feel is deliberately narrow:
 *
 *   - only the first two screens take part (the hero and the statistics screen);
 *   - a small wheel nudge is swallowed, so the page appears to resist;
 *   - once the accumulated delta passes `threshold`, it hops exactly one screen;
 *   - anywhere below the last stop the wheel is handed straight back to the browser,
 *     so long score lists scroll normally.
 *
 * Why not CSS `scroll-snap`? The scrolling element is <html>, and snap is enforced by
 * the compositor, which made the behaviour unverifiable in this project's headless test
 * setup. Snap also has no notion of a wheel-delta threshold, which is the whole point
 * of the "resistance" effect.
 */

export interface WheelSnapOptions {
  /**
   * Document-space scroll offsets to snap between, ascending. Evaluated lazily on each
   * gesture so layout changes (a banner appearing, fonts settling) are picked up.
   */
  stops: () => number[]
  /** Accumulated wheel delta (px) required before hopping a screen. */
  threshold?: number
  /** Wheel inactivity (ms) after which partial accumulation is discarded. */
  idleResetMs?: number
  /** Scroll animation duration (ms). */
  durationMs?: number
  /** Tolerance (px) for deciding we are already resting on a stop. */
  slack?: number
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

export function useWheelSnap(options: WheelSnapOptions) {
  const {
    stops,
    threshold = 160,
    idleResetMs = 140,
    durationMs = 640,
    slack = 8,
  } = options

  /** Accumulated, not-yet-committed wheel delta. */
  let acc = 0
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let animation: number | undefined
  /** True while our own scroll animation runs — wheel input is swallowed meanwhile. */
  let animating = false
  let bound = false

  function stopAnimation() {
    if (animation !== undefined) {
      cancelAnimationFrame(animation)
      animation = undefined
    }
    animating = false
  }

  /**
   * The page sets `html { scroll-behavior: smooth }`, which would turn every
   * `scrollTo` below into its own animation — our rAF loop would then fight dozens of
   * competing smooth scrolls. Force `instant` so we own the motion.
   */
  function jumpTo(y: number) {
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior })
  }

  function scrollTo(target: number, animate: boolean) {
    stopAnimation()
    const from = window.scrollY
    const max = document.documentElement.scrollHeight - window.innerHeight
    const to = Math.max(0, Math.min(target, max))

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!animate || reduced || Math.abs(to - from) < 2) {
      jumpTo(to)
      return
    }

    animating = true
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      jumpTo(from + (to - from) * easeInOutCubic(t))
      if (t < 1) {
        animation = requestAnimationFrame(step)
      }
      else {
        animation = undefined
        animating = false
      }
    }
    animation = requestAnimationFrame(step)
  }

  function resetAcc() {
    acc = 0
    if (idleTimer !== undefined) {
      clearTimeout(idleTimer)
      idleTimer = undefined
    }
  }

  function onWheel(event: WheelEvent) {
    // Leave pinch-zoom and horizontal gestures to the browser.
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return
    }

    // Our own animation is in flight: swallow input so hops can't queue up.
    if (animating) {
      event.preventDefault()
      return
    }

    const direction = Math.sign(event.deltaY)
    if (direction === 0) {
      return
    }

    const points = stops()
      .filter(n => Number.isFinite(n))
      .sort((a, b) => a - b)
    if (points.length < 2) {
      return
    }

    const first = points[0]
    const last = points[points.length - 1]
    const y = window.scrollY

    // Outside the snapped band, scroll natively — this is what keeps the score
    // sections (taller than the viewport) fully readable.
    if (y > last + slack || y < first - slack) {
      resetAcc()
      return
    }

    // Nearest stop in the direction of travel.
    const target = direction > 0
      ? points.find(point => point > y + slack)
      : [...points].reverse().find(point => point < y - slack)

    // Already at the edge of the band with nothing ahead: hand the gesture back to the
    // browser instead of swallowing it (otherwise the page would feel stuck).
    if (target === undefined) {
      resetAcc()
      return
    }

    event.preventDefault()

    // A change of direction abandons the previous intent.
    if (acc !== 0 && Math.sign(acc) !== direction) {
      acc = 0
    }
    acc += event.deltaY

    if (idleTimer !== undefined) {
      clearTimeout(idleTimer)
    }
    // Not enough of a push and the user paused: drop it. This is the "resistance".
    idleTimer = setTimeout(resetAcc, idleResetMs)

    if (Math.abs(acc) < threshold) {
      return
    }

    resetAcc()
    scrollTo(target, true)
  }

  onMounted(() => {
    // `passive: false` is required to be allowed to preventDefault.
    window.addEventListener('wheel', onWheel, { passive: false })
    bound = true
  })

  onBeforeUnmount(() => {
    if (bound) {
      window.removeEventListener('wheel', onWheel)
      bound = false
    }
    resetAcc()
    stopAnimation()
  })
}

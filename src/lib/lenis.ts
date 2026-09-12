import Lenis from 'lenis'
import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from './gsap'

let globalLenis: Lenis | null = null

export function getLenis(): Lenis | null {
  return globalLenis
}

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    let updateTicker: ((time: number) => void) | null = null
    let lenis: Lenis | null = null
    let cancelled = false

    const init = () => {
      if (cancelled) return

      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
      })

      globalLenis = lenis
      lenisRef.current = lenis

      lenis.on('scroll', () => {
        ScrollTrigger.update()
      })

      updateTicker = (time: number) => {
        lenis?.raf(time * 1000)
      }

      gsap.ticker.add(updateTicker)
      gsap.ticker.lagSmoothing(0)
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number }).requestIdleCallback(init, { timeout: 200 })
      return () => {
        cancelled = true
        if ('cancelIdleCallback' in window) {
          (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle)
        }
        if (updateTicker) gsap.ticker.remove(updateTicker)
        lenis?.destroy()
        lenisRef.current = null
      }
    } else {
      const timer = setTimeout(init, 50)
      return () => {
        cancelled = true
        clearTimeout(timer)
        if (updateTicker) gsap.ticker.remove(updateTicker)
        lenis?.destroy()
        lenisRef.current = null
      }
    }
  }, [])

  return lenisRef
}

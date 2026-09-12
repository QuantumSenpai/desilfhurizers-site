import { useEffect } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { useStore } from '../state/store'

/**
 * Scroll-driven explode progress and focus index hook.
 *
 * ARCHITECTURAL DESIGN (V11 Final):
 * - Hero, Ergonomics, WorkingPrinciple: explodeProgress is strictly 0.0.
 * - Hardware section exclusively drives the explode timeline via pinned hardwareTrigger:
 *   - Phase A (0.00 -> 0.12): Smooth radial explode into full overview (0.0 -> 1.0, focusIndex = -1)
 *   - Phase B (0.12 -> 0.82): 1-by-1 True Isolation sequence (focusIndex 0.0 -> 6.0)
 *   - Phase C (0.82 -> 0.98): Full Watch Reassembly (1.0 -> 0.0, focusIndex = -1)
 *   - Ready for Telemetry (>= 0.98): explodeProgress = 0.0, assembled watch
 * - Continuous float values (explodeProgress, fractional focusIndex) are stored exclusively
 *   in module-level scrollState read by useFrame at 60fps — ZERO React re-renders on scroll ticks.
 * - Only discrete whole-number part changes trigger setFocusIndex.
 * - scrub: 0.35 eliminates 1000ms lag while preventing fast-flick momentum staircase jumps.
 */

// Canonical Hardware Section Phase Boundaries (Single Source of Truth)
export const HARDWARE_PHASE_B_START = 0.12
export const HARDWARE_PHASE_B_SETTLE = 0.76
export const HARDWARE_PHASE_B_END = 0.82

/**
 * Calculates the exact Hardware section scroll progress (0.0 to 1.0)
 * corresponding to a given 0–6 component isolation index.
 */
export function getHardwarePartScrollProgress(partIndex: number): number {
  const clamped = Math.max(0, Math.min(5, partIndex))
  const norm = clamped / 5.0
  return HARDWARE_PHASE_B_START + norm * (HARDWARE_PHASE_B_SETTLE - HARDWARE_PHASE_B_START)
}

// Raw continuous floats — read inside useFrame at 60fps, never trigger React re-renders
export const scrollState = {
  explodeProgress: 0,
  focusIndex: -1,
  principleStep: 0,
}

export function useScrollExplode() {
  const setFocusIndex = useStore((s) => s.setFocusIndex)
  const setActiveSection = useStore((s) => s.setActiveSection)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      scrollState.explodeProgress = 0.0
      return
    }

    // Ensure initial state at top of page is fully assembled
    scrollState.explodeProgress = 0.0
    scrollState.focusIndex = -1

    let lastSnappedFocus = -1

    // Section 3: Hardware Showcase Pinning (+550% scroll room)
    const hardwareTrigger = ScrollTrigger.create({
      id: 'hardware-trigger',
      trigger: '#hardware',
      start: 'top top',
      end: '+=550%',
      pin: true,
      scrub: 0.35,
      anticipatePin: 1,
      onEnter: () => {
        setActiveSection('hardware')
        setSelectedPartId(null)
      },
      onEnterBack: () => {
        setActiveSection('hardware')
        setSelectedPartId(null)
      },
      onUpdate: (self) => {
        const p = self.progress

        // Clear any leftover selectedPartId from Ergonomics when scrolling in Hardware
        if (useStore.getState().selectedPartId !== null) {
          setSelectedPartId(null)
        }

        if (p < HARDWARE_PHASE_B_START) {
          // Phase A: Smooth Radial Explode from Assembled (0.0) to Full Overview (1.0)
          // Completes full separation by p = 0.09, plateauing in full overview until p = 0.12
          const explodeT = Math.min(1, Math.max(0, p / 0.09))
          scrollState.explodeProgress = explodeT
          scrollState.focusIndex = -1

          if (lastSnappedFocus !== -1) {
            lastSnappedFocus = -1
            setFocusIndex(-1)
          }
        } else if (p <= HARDWARE_PHASE_B_END) {
          // Phase B: 1-by-1 True Isolation Sequence (6 functional parts, focusIndex 0 -> 5)
          // Part 5 (Battery) settles comfortably by p = 0.76, providing a stable inspection plateau
          const norm = Math.min(1, Math.max(0, (p - HARDWARE_PHASE_B_START) / (HARDWARE_PHASE_B_SETTLE - HARDWARE_PHASE_B_START)))
          const rawFocus = Math.max(0, Math.min(5, norm * 5.0))

          scrollState.explodeProgress = 1.0
          scrollState.focusIndex = rawFocus

          // Only write discrete integer focusIndex to store on whole-part changes
          const snappedFocus = Math.round(rawFocus)
          if (snappedFocus !== lastSnappedFocus) {
            lastSnappedFocus = snappedFocus
            setFocusIndex(snappedFocus)
          }
        } else if (p <= 0.98) {
          // Phase C: Full Watch Reassembly (1.0 -> 0.0, focusIndex = -2 differentiates from Phase A)
          const reassembleT = Math.min(1, Math.max(0, (p - HARDWARE_PHASE_B_END) / (0.98 - HARDWARE_PHASE_B_END)))
          scrollState.explodeProgress = 1.0 - reassembleT
          scrollState.focusIndex = -2

          if (lastSnappedFocus !== -2) {
            lastSnappedFocus = -2
            setFocusIndex(-2)
          }
        } else {
          // Fully assembled watch ready for Telemetry
          scrollState.explodeProgress = 0.0
          scrollState.focusIndex = -1

          if (lastSnappedFocus !== -1) {
            lastSnappedFocus = -1
            setFocusIndex(-1)
          }
        }
      },
      onLeave: () => {
        scrollState.explodeProgress = 0.0
        scrollState.focusIndex = -1
        lastSnappedFocus = -1
        setFocusIndex(-1)
        setActiveSection('connectivity')
      },
      onLeaveBack: () => {
        scrollState.explodeProgress = 0.0
        scrollState.focusIndex = -1
        lastSnappedFocus = -1
        setFocusIndex(-1)
        setActiveSection('principle')
      },
    })

    return () => {
      hardwareTrigger.kill()
    }
  }, [setFocusIndex, setActiveSection])
}

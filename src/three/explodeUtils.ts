import * as THREE from 'three'
import { SHOWCASE_INDEX_MAP } from '../data/components'
import { cameraTravelState } from './cameraTravelState'
import { scrollState } from '../hooks/useScrollExplode'

/**
 * Calculates exploded separation factor (0.0 -> 1.0).
 * Boosts separation specifically in the 0.35-0.65 band so parts are clearly separated
 * and non-colliding during WorkingPrinciple (mid-scroll), while keeping 0 and 1.0 endpoints exact.
 */
export function getExplodeSeparation(progress: number): number {
  const p = Math.max(0, Math.min(1, progress))
  let t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
  if (p > 0.15 && p < 0.85) {
    const bell = Math.sin(((p - 0.15) / 0.70) * Math.PI)
    t = Math.min(1, t + bell * 0.22)
  }
  return t
}

/**
 * Maps Phase B showcase focusIndex (0–5) to HARDWARE_PARTS index (0–7).
 * SHOWCASE_PARTS order: ESP32(2), H2S(1), Temp(4), Buzzer(5), OLED(3), Battery(6)
 * Enclosures (casing-top=0, casing-bottom=7) are never active during Phase B.
 */
const SHOWCASE_TO_HW_INDEX: number[] = [2, 1, 4, 5, 3, 6]

/**
 * Returns the HARDWARE_PARTS index of the currently focused part during Phase B.
 * Returns -1 if focusIndex < 0 (overview / reassembly).
 */
export function getFocusedHardwareIndex(focusIndex: number): number {
  if (focusIndex < 0) return -1
  const idx = Math.round(Math.max(0, Math.min(5, focusIndex)))
  return SHOWCASE_TO_HW_INDEX[idx]
}

/**
 * Calculates part opacity, focus highlight, scale, and settle-back offset during
 * the 1-by-1 true part isolation sequence.
 *
 * GATED ON CAMERA TRAVEL ARRIVAL:
 * When camera is flying between parts:
 * - Exiting part smoothly dissolves over t in [0.0, 0.45], scaling gently from 1.14 -> 1.0 (no shrink dip).
 * - Entering part illuminates and materializes over t in [0.40, 1.0], expanding from 1.0 -> 1.14 presence.
 * - Stationary focused part sits dominant at opacity 1.0, scale 1.14, highlight 1.0.
 *
 * Single source of truth:
 * - partIdOrIndex: string ID ('esp32', 'temp-sensor', 'battery', etc.) or numeric showcase index (0–5).
 * - focusIndex: continuous float from store/scrollState (0.0–6.0 during Phase B, -1 otherwise).
 */
// Per-part scale tuning for Phase A full-explode overview:
// Smaller sensors and modules get boosted proportionally so the whole subsystem stack
// reads as visually balanced, while housing shells are gently attenuated to frame them.
const OVERVIEW_PART_SCALES: Record<string, number> = {
  'temp-sensor': 1.45,
  'buzzer-led': 1.40,
  'h2s-sensor': 1.25,
  'oled-display': 1.20,
  'esp32': 1.12,
  'battery': 1.05,
  'casing-top': 0.94,
  'casing-bottom': 0.94,
}

export function getPartOpacityAndHighlight(
  partIdOrIndex: string | number,
  focusIndex: number
): {
  opacity: number
  isFocused: boolean
  highlightFactor: number
  scale: number
  settleOffset: number
} {
  // Extract partId string if available
  const partId = typeof partIdOrIndex === 'string' ? partIdOrIndex : Object.keys(SHOWCASE_INDEX_MAP)[partIdOrIndex] || ''

  // Phase A (overview, focusIndex === -1): All parts fully visible (opacity 1.0)
  if (focusIndex === -1) {
    const targetScale = OVERVIEW_PART_SCALES[partId] ?? 1.0
    const p = Math.max(0, Math.min(1, scrollState.explodeProgress))
    const scale = THREE.MathUtils.lerp(1.0, targetScale, Math.min(1, p * 1.2))
    return { opacity: 1.0, isFocused: false, highlightFactor: 0, scale, settleOffset: 0 }
  }

  // Phase C (reassembly, focusIndex === -2):
  // Battery was isolated (opacity 1.0). The other 8 parts smoothly fade in over the first
  // phase of reassembly (as explodeProgress decreases from 1.0 to 0.80) to eliminate the reassembly pop.
  if (focusIndex === -2) {
    const targetScale = OVERVIEW_PART_SCALES[partId] ?? 1.0
    const p = Math.max(0, Math.min(1, scrollState.explodeProgress))
    const scale = THREE.MathUtils.lerp(1.0, targetScale, Math.min(1, p * 1.2))
    let opacity = 1.0
    if (partId !== 'battery') {
      // Smooth fade-in curve: 0.0 at p = 1.0, reaches 1.0 at p = 0.80
      const fadeProgress = Math.min(1, Math.max(0, (1.0 - p) / 0.20))
      opacity = Math.sin(fadeProgress * (Math.PI / 2))
    }
    return { opacity, isFocused: false, highlightFactor: 0, scale, settleOffset: 0 }
  }

  // Resolve 0–6 showcase index from string ID or number
  let showcaseIdx = -1
  if (typeof partIdOrIndex === 'string') {
    if (partIdOrIndex === 'casing-top' || partIdOrIndex === 'casing-bottom') {
      showcaseIdx = -1
    } else if (partIdOrIndex in SHOWCASE_INDEX_MAP) {
      showcaseIdx = SHOWCASE_INDEX_MAP[partIdOrIndex]
    }
  } else {
    showcaseIdx = partIdOrIndex
  }

  // Enclosures are always hidden during Phase B isolation
  if (showcaseIdx < 0 || showcaseIdx > 5) {
    return { opacity: 0, isFocused: false, highlightFactor: 0, scale: 1.0, settleOffset: 0.12 }
  }

  const targetIdx = cameraTravelState.targetPartIndex >= 0
    ? cameraTravelState.targetPartIndex
    : Math.round(Math.max(0, Math.min(5, focusIndex)))
  const prevIdx = cameraTravelState.currentPartIndex
  const t = cameraTravelState.travelProgress
  const isTraveling = cameraTravelState.isTraveling

  // Case 1: This is the target (incoming or stationary) focused part
  if (showcaseIdx === targetIdx) {
    if (isTraveling && prevIdx >= 0 && prevIdx !== targetIdx) {
      // Continuous constant-energy crossfade: sin(t * pi/2)
      const opacity = Math.sin(t * (Math.PI / 2))
      const scale = THREE.MathUtils.lerp(1.0, 1.14, Math.pow(t, 1.3))
      const highlightFactor = Math.max(0, t)
      const settleOffset = THREE.MathUtils.lerp(0.12, 0, t)
      return { opacity, isFocused: t > 0.8, highlightFactor, scale, settleOffset }
    }

    // Fully arrived / stationary focus
    return { opacity: 1.0, isFocused: true, highlightFactor: 1.0, scale: 1.14, settleOffset: 0 }
  }

  // Case 2: This is the departing part that the camera is flying away from
  if (isTraveling && showcaseIdx === prevIdx && prevIdx !== targetIdx) {
    // Continuous constant-energy crossfade: cos(t * pi/2)
    const opacity = Math.cos(t * (Math.PI / 2))
    const scale = THREE.MathUtils.lerp(1.14, 1.0, t)
    const highlightFactor = Math.max(0, 1 - t)
    const settleOffset = THREE.MathUtils.lerp(0, 0.12, t)
    return { opacity, isFocused: false, highlightFactor, scale, settleOffset }
  }

  // Case 3: Completely non-focused part — strictly 0 opacity (V6 rule)
  return { opacity: 0, isFocused: false, highlightFactor: 0, scale: 1.0, settleOffset: 0.12 }
}

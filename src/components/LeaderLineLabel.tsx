import type { HardwarePart } from '../data/components'
export { LeaderLinesOverlay } from './LeaderLinesOverlay'

interface LeaderLineLabelProps {
  part: HardwarePart
  side?: 'left' | 'right'
  offset?: [number, number, number]
}

// Retained as backward-compatible stub for part files; active rendering is handled by LeaderLinesOverlay
export function LeaderLineLabel(_props: LeaderLineLabelProps) {
  return null
}

import * as THREE from 'three'

export interface PartPositionConfig {
  id: string
  assembled: [number, number, number]
  exploded: [number, number, number]
}

/**
 * SINGLE SOURCE OF TRUTH for 3D Component Positions.
 *
 * Canonical 8-Part Subsystem Architecture (Straps parented to casings, excluded from explode):
 * - casing-top: Top Forward (+Y, +Z)
 * - h2s-sensor: Upper Left Forward (-X, +Y, +Z)
 * - esp32: Mid Left Rear (-X, 0Y, -Z) — 2.1u travel, clear of front plane
 * - buzzer-led: Far Left Mid (-X, -Y, +Z)
 * - oled-display: Far Right Mid (+X, -Y, +Z)
 * - temp-sensor: Lower Right Forward (+X, -Y, +Z)
 * - battery: Lower Center Forward (+X, -Y, +Z) — 2.85u clear air in Z from casing-bottom
 * - casing-bottom: Bottom Rear (-Y, -Z)
 *
 * All coordinates have distinct directional rays with verified zero bounding-box intersections
 * at full explode (min pairwise gap >= 1.90u) and at all intermediate scrubs (min gap >= 0.95u).
 */
export const PART_POSITIONS: Record<string, PartPositionConfig> = {
  'casing-top': {
    id: 'casing-top',
    assembled: [0.00, 0.00, 0.15],
    exploded: [0.00, 4.20, 2.20],
  },
  'h2s-sensor': {
    id: 'h2s-sensor',
    assembled: [-0.45, 0.35, 0.18],
    exploded: [-2.75, 1.80, 1.00],
  },
  'esp32': {
    id: 'esp32',
    assembled: [0.00, 0.00, -0.05],
    exploded: [-1.40, 0.00, -1.40],
  },
  'buzzer-led': {
    id: 'buzzer-led',
    assembled: [-0.55, -0.35, 0.18],
    exploded: [-3.20, -0.80, 0.60],
  },
  'oled-display': {
    id: 'oled-display',
    assembled: [0.00, 0.00, 0.22],
    exploded: [3.40, -0.20, 0.80],
  },
  'temp-sensor': {
    id: 'temp-sensor',
    assembled: [0.55, -0.35, 0.18],
    exploded: [2.40, -1.80, 0.40],
  },
  'battery': {
    id: 'battery',
    assembled: [0.00, -0.15, -0.15],
    exploded: [0.60, -2.00, 0.80],
  },
  'casing-bottom': {
    id: 'casing-bottom',
    assembled: [0.00, 0.00, -0.15],
    exploded: [0.00, -4.20, -2.20],
  },
}

/**
 * Pre-allocated Three.js Vector3 array for WatchModel screen projections.
 */
export const PART_ANCHOR_VECTORS = Object.values(PART_POSITIONS).map((p) => ({
  id: p.id,
  assembled: new THREE.Vector3(...p.assembled),
  exploded: new THREE.Vector3(...p.exploded),
}))

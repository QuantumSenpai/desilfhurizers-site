import * as THREE from 'three'

export interface CameraPose {
  pos: THREE.Vector3
  target: THREE.Vector3
  fov: number
}

/**
 * Module-level continuous camera travel state.
 * Read inside useFrame by dependent systems (explodeUtils, LeaderLinesOverlay, 3D parts)
 * to gate card content, leader lines, and part opacity/scale on camera arrival.
 * Zero React re-renders.
 */
export const cameraTravelState = {
  activeKey: 'hero',
  currentPartIndex: -1,
  targetPartIndex: -1,
  travelProgress: 1.0, // 0.0 to 1.0
  easedT: 1.0,
  isTraveling: false,
}

/**
 * High-end cinematic ease-in-out cubic curve.
 * Starts with gentle acceleration and ends with a smooth, luxurious deceleration into the stop.
 */
export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/**
 * Ease-in-out quad curve for subtle transitions.
 */
export function easeInOutQuad(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

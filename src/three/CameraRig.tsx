import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { scrollState } from '../hooks/useScrollExplode'
import { cameraTravelState, easeInOutCubic } from './cameraTravelState'

export interface CameraPoseData {
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
}

/**
 * Canonical Camera Poses for every phase and section of DESULPHERISERS.
 *
 * All isolated parts (0–5) align 1:1 with SHOWCASE_PARTS in components.ts:
 * 0: ESP32-S3 (MCU & BLE antenna)
 * 1: H2S Sensor Substrate (Upper left optical chamber)
 * 2: Temp/Humidity Sensor (Lower right SHT40)
 * 3: Buzzer & LED (Lower left alert module)
 * 4: OLED Display Screen (Right side high-contrast screen)
 * 5: Rechargeable Li-Po Battery (Lower center 350mAh cell)
 *
 * Each pose is framed so the focused 3D component sits beautifully in the right ~62%–68%
 * viewport area, leaving the left column clear for the docked HUD card and leader lines.
 */
export const CAMERA_POSES: Record<string, CameraPoseData> = {
  // Hero landing
  'hero': { pos: [0, 0, 6.5], target: [0, 0, 0], fov: 38 },

  // Section 1: Industrial Ergonomics — assembled watch overview
  'design': { pos: [1.1, 0.2, 5.8], target: [0.15, 0.0, 0], fov: 38 },
  // Subsystem focus in Ergonomics
  'design-esp32': { pos: [0.8, -0.1, 5.4], target: [0.0, 0.0, 0], fov: 36 },
  'design-h2s-sensor': { pos: [0.6, 0.4, 5.2], target: [-0.25, 0.2, 0.1], fov: 36 },
  'design-oled-display': { pos: [1.1, -0.1, 5.2], target: [0.0, -0.15, 0.1], fov: 36 },
  'design-temp-sensor': { pos: [1.2, -0.2, 5.2], target: [0.3, -0.1, 0.05], fov: 36 },
  'design-buzzer-led': { pos: [0.6, -0.2, 5.2], target: [-0.25, -0.15, 0.1], fov: 36 },
  'design-battery': { pos: [0.9, -0.4, 5.4], target: [0.0, -0.15, -0.05], fov: 36 },

  // Section 2: Principle 4-step colorimetric inference pipeline
  'principle': { pos: [1.10, 0.20, 5.6], target: [0.15, 0.00, 0], fov: 38 },
  'principle-step-0': { pos: [0.95, 0.40, 5.2], target: [-0.10, 0.15, 0.1], fov: 38 },
  'principle-step-1': { pos: [1.25, 0.40, 5.2], target: [0.20, 0.15, 0.1], fov: 38 },
  'principle-step-2': { pos: [1.10, 0.15, 5.2], target: [0.10, 0.00, 0.0], fov: 38 },
  'principle-step-3': { pos: [1.10, 0.20, 5.6], target: [0.15, 0.00, 0], fov: 38 },

  // Section 3: Hardware Phase A — Wide radial exploded overview (all 9 subsystems clearly separated)
  'hardware-phase-a': { pos: [0.8, 0.2, 7.6], target: [0.1, -0.1, 0], fov: 44 },

  // Section 3: Hardware Phase B — 1-by-1 True Isolation Walkthrough (6 functional parts)
  'hardware-part-0': { pos: [0.4, 0.1, 4.2], target: [-0.84, 0.00, -0.84], fov: 38 },
  'hardware-part-1': { pos: [-0.7, 1.4, 4.4], target: [-1.65, 1.08, 0.60], fov: 38 },
  'hardware-part-2': { pos: [2.3, -1.2, 4.4], target: [1.44, -1.08, 0.24], fov: 38 },
  'hardware-part-3': { pos: [-1.0, -0.6, 4.4], target: [-1.92, -0.48, 0.36], fov: 38 },
  'hardware-part-4': { pos: [2.8, -0.1, 4.4], target: [2.04, -0.12, 0.48], fov: 38 },
  'hardware-part-5': { pos: [1.2, -1.3, 4.4], target: [0.36, -1.20, 0.48], fov: 38 },

  // Section 3: Hardware Phase C — Reassembly
  'hardware-phase-c': { pos: [0.8, 0.2, 5.8], target: [0.1, 0.0, 0], fov: 38 },

  // Section 4: Telemetry / Connectivity section (assembled watch paired with phone)
  'connectivity': { pos: [0.4, 0.0, 6.2], target: [-0.15, 0.0, 0], fov: 38 },

  // Section 5: Benchmark Results & Footer
  'results': { pos: [0.0, 0.0, 6.5], target: [0, 0, 0], fov: 38 },
}

export function CameraRig() {
  const activeSection = useStore((s) => s.activeSection)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setCameraPosition = useStore((s) => s.setCameraPosition)

  // Tracking state refs (no React re-renders)
  const activeKeyRef = useRef('hero')
  const startPos = useRef(new THREE.Vector3(0, 0, 6.5))
  const endPos = useRef(new THREE.Vector3(0, 0, 6.5))
  const startTarget = useRef(new THREE.Vector3(0, 0, 0))
  const endTarget = useRef(new THREE.Vector3(0, 0, 0))
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const startFov = useRef(38)
  const endFov = useRef(38)
  const travelStartTime = useRef(0)
  const travelDuration = useRef(0.9)
  const isInitialized = useRef(false)

  // Working vectors for arc math (allocated once)
  const tempStartRel = useRef(new THREE.Vector3())
  const tempEndRel = useRef(new THREE.Vector3())
  const tempStartDir = useRef(new THREE.Vector3())
  const tempEndDir = useRef(new THREE.Vector3())
  const tempCurrentDir = useRef(new THREE.Vector3())

  useFrame((state) => {
    const { camera } = state
    const now = performance.now() / 1000

    // Determine target pose key based on current scroll state and section
    const focusIndex = scrollState.focusIndex

    let targetKey = 'hero'

    if (activeSection === 'connectivity') {
      targetKey = 'connectivity'
    } else if (activeSection === 'results') {
      targetKey = 'results'
    } else if (activeSection === 'design') {
      targetKey = selectedPartId ? `design-${selectedPartId}` : 'design'
    } else if (focusIndex >= 0) {
      // Phase B isolation: discrete part index 0–5
      const clamped = Math.max(0, Math.min(5, Math.round(focusIndex)))
      targetKey = `hardware-part-${clamped}`
    } else if (activeSection === 'hardware' || activeSection === 'explode') {
      if (focusIndex === -2) {
        targetKey = 'hardware-phase-c'
      } else {
        targetKey = 'hardware-phase-a'
      }
    } else if (activeSection === 'principle') {
      const step = Math.min(2, Math.max(0, scrollState.principleStep ?? 0))
      targetKey = `principle-step-${step}`
    } else {
      targetKey = 'hero'
    }

    const pose = CAMERA_POSES[targetKey] || CAMERA_POSES['hero']

    // On target pose change, initiate smooth time-based travel along arc
    if (!isInitialized.current) {
      isInitialized.current = true
      activeKeyRef.current = targetKey
      camera.position.set(...pose.pos)
      currentLookAt.current.set(...pose.target)
      camera.lookAt(currentLookAt.current)
      const persp = camera as THREE.PerspectiveCamera
      if (persp.isPerspectiveCamera) {
        persp.fov = pose.fov
        persp.updateProjectionMatrix()
      }
      startPos.current.copy(camera.position)
      endPos.current.set(...pose.pos)
      startTarget.current.copy(currentLookAt.current)
      endTarget.current.set(...pose.target)
      startFov.current = pose.fov
      endFov.current = pose.fov
      travelStartTime.current = now
      travelDuration.current = 0.001
    } else if (targetKey !== activeKeyRef.current) {
      // Capture CURRENT camera state as starting point
      startPos.current.copy(camera.position)
      startTarget.current.copy(currentLookAt.current)
      const persp = camera as THREE.PerspectiveCamera
      startFov.current = persp.isPerspectiveCamera ? persp.fov : 38

      endPos.current.set(...pose.pos)
      endTarget.current.set(...pose.target)
      endFov.current = pose.fov

      const prevKey = activeKeyRef.current
      activeKeyRef.current = targetKey
      travelStartTime.current = now

      // Distance-aware duration tuning with momentum preservation
      const dist = startPos.current.distanceTo(endPos.current)
      const isPartToPart = prevKey.startsWith('hardware-part-') && targetKey.startsWith('hardware-part-')
      const isPrincipleStep = prevKey.startsWith('principle-step-') && targetKey.startsWith('principle-step-')
      if (isPartToPart) {
        // Shorter, agile travel duration for adjacent parts with seamless momentum
        travelDuration.current = THREE.MathUtils.clamp(0.60 + dist * 0.06, 0.65, 0.90)
      } else if (isPrincipleStep) {
        travelDuration.current = THREE.MathUtils.clamp(0.70 + dist * 0.06, 0.75, 0.95)
      } else {
        // Section transitions (e.g. Overview → Part 0, or Reassembly → Telemetry)
        travelDuration.current = THREE.MathUtils.clamp(0.95 + dist * 0.08, 1.05, 1.25)
      }

      // Update module-level travel state
      const targetIdx = targetKey.startsWith('hardware-part-') ? parseInt(targetKey.replace('hardware-part-', ''), 10) : -1
      const prevIdx = prevKey.startsWith('hardware-part-') ? parseInt(prevKey.replace('hardware-part-', ''), 10) : -1

      cameraTravelState.activeKey = targetKey
      cameraTravelState.currentPartIndex = prevIdx
      cameraTravelState.targetPartIndex = targetIdx
      cameraTravelState.travelProgress = 0.0
      cameraTravelState.easedT = 0.0
      cameraTravelState.isTraveling = true
    }

    // ── TIME-BASED EASING INTERPOLATION ──
    const elapsed = now - travelStartTime.current
    const rawT = THREE.MathUtils.clamp(elapsed / travelDuration.current, 0, 1)
    const easedT = easeInOutCubic(rawT)

    // Update travel state for dependent UI (cards, leader lines, part opacities)
    cameraTravelState.travelProgress = rawT
    cameraTravelState.easedT = easedT
    cameraTravelState.isTraveling = rawT < 1.0

    // Interpolate LookAt target on the exact same eased t
    currentLookAt.current.lerpVectors(startTarget.current, endTarget.current, easedT)

    // ── SPHERICAL ARC INTERPOLATION FOR FLUID CINEMATIC FLIGHT ──
    // Relative position vectors from the moving lookAt target
    const startRel = tempStartRel.current.subVectors(startPos.current, startTarget.current)
    const endRel = tempEndRel.current.subVectors(endPos.current, endTarget.current)

    const startDist = startRel.length()
    const endDist = endRel.length()

    const startDir = tempStartDir.current.copy(startRel).normalize()
    const endDir = tempEndDir.current.copy(endRel).normalize()

    // Interpolate viewing direction
    const currentDir = tempCurrentDir.current.lerpVectors(startDir, endDir, easedT).normalize()

    // Radial distance with outward arc displacement
    const baseDist = THREE.MathUtils.lerp(startDist, endDist, easedT)
    const angleDiff = startDir.angleTo(endDir)
    // Scale arc magnitude by angular separation (subtle ~0.08 for small hops, ~0.35 for wide sweeps)
    const arcMagnitude = THREE.MathUtils.clamp(angleDiff * 0.32, 0.06, 0.38)
    const arcOffset = Math.sin(easedT * Math.PI) * arcMagnitude
    const currentDist = baseDist + arcOffset

    // Position camera along arc
    camera.position.copy(currentLookAt.current).addScaledVector(currentDir, currentDist)

    // Synchronize lookAt directly with currentLookAt — zero whip-pan
    camera.lookAt(currentLookAt.current)

    // FOV interpolation
    const perspCam = camera as THREE.PerspectiveCamera
    if (perspCam.isPerspectiveCamera) {
      perspCam.fov = THREE.MathUtils.lerp(startFov.current, endFov.current, easedT)
      perspCam.updateProjectionMatrix()
    }

    // Publish camera coordinates for debug overlay if ?debug=1
    if (window.location.search.includes('debug=1')) {
      setCameraPosition([camera.position.x, camera.position.y, camera.position.z])
    }
  })

  return null
}

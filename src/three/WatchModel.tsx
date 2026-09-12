import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CasingTop } from './parts/CasingTop'
import { H2sSensor } from './parts/H2sSensor'
import { OledDisplay } from './parts/OledDisplay'
import { Esp32Board } from './parts/Esp32Board'
import { TempSensor } from './parts/TempSensor'
import { Battery } from './parts/Battery'
import { BuzzerLed } from './parts/BuzzerLed'
import { CasingBottom } from './parts/CasingBottom'

import { leaderLinesHandle } from '../components/LeaderLinesOverlay'
import { getExplodeSeparation } from './explodeUtils'
import { scrollState } from '../hooks/useScrollExplode'
import { PART_ANCHOR_VECTORS } from '../data/explodePositions'
import { useStore } from '../state/store'

interface WatchModelProps {
  progress?: number
}

export function WatchModel({ progress: propProgress }: WatchModelProps) {
  // Read explodeProgress purely from scrollState ref to prevent React re-renders on scroll ticks
  const progress = propProgress ?? 0
  const groupRef = useRef<THREE.Group>(null)
  const tempVec = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const frameProgress = propProgress !== undefined ? propProgress : scrollState.explodeProgress

    const isDesktop = state.size.width >= 1024
    // Calculate world X that maps to 72% viewport width in Hero
    const halfHeight = 6.5 * Math.tan((38 / 2) * Math.PI / 180)
    const halfWidth = halfHeight * (state.size.width / state.size.height)
    const heroX = isDesktop ? 0.44 * halfWidth : 0

    // Slow ambient idle oscillation in Hero range (frameProgress < 0.05)
    // Blend smoothly to zero as user scrolls past 0.05 to avoid sudden snaps
    const idleBlend = Math.max(0, Math.min(1, (0.05 - frameProgress) / 0.04))
    const idleRotY = Math.sin(state.clock.elapsedTime * 0.5) * 0.15 * idleBlend
    const idleRotX = Math.cos(state.clock.elapsedTime * 0.4) * 0.03 * idleBlend

    // Strictly no tilt in Hero (frameProgress <= 0.15), with subtle alive idle rotation
    if (frameProgress <= 0.15) {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, heroX, 10, delta)
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 10, delta)
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, 0, 10, delta)
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, idleRotX, 10, delta)
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, idleRotY, 10, delta)
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, 0, 10, delta)
    } else {
      // Smoothly transition position as camera moves in exploded sections
      const targetX = THREE.MathUtils.lerp(heroX, isDesktop ? 0.5 : 0, (frameProgress - 0.15) / 0.85)
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 8, delta)

      // Subtle isometric angle when scrolled past Hero
      const targetRotY = THREE.MathUtils.lerp(0, -0.25, (frameProgress - 0.15) / 0.85)
      const targetRotX = THREE.MathUtils.lerp(0, 0.15, (frameProgress - 0.15) / 0.85)
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 6, delta)
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 6, delta)
    }

    // Project 3D Part World Anchors to Screen Pixels.
    // Query live world position directly from named part groups to capture
    // true dampened coordinates, settle offsets, and camera matrix.
    const activeSection = useStore.getState().activeSection
    const rawFocus = scrollState.focusIndex
    const needsProjection = leaderLinesHandle.update !== null &&
      (activeSection === 'principle' || rawFocus >= 0 || (frameProgress > 0.15 && frameProgress <= 1.0))

    if (needsProjection) {
      const anchors: Record<string, { x: number; y: number }> = {}
      const v = tempVec.current

      groupRef.current.traverse((child) => {
        if (child.name && child.name.startsWith('part-')) {
          const partId = child.name.slice(5)
          child.getWorldPosition(v)
          v.project(state.camera)
          anchors[partId] = {
            x: (v.x * 0.5 + 0.5) * state.size.width,
            y: (-v.y * 0.5 + 0.5) * state.size.height,
          }
        }
      })

      // Fallback in case a child group has not mounted yet
      PART_ANCHOR_VECTORS.forEach((p) => {
        if (!anchors[p.id]) {
          const t = getExplodeSeparation(frameProgress)
          v.lerpVectors(p.assembled, p.exploded, t)
          groupRef.current!.localToWorld(v)
          v.project(state.camera)
          anchors[p.id] = {
            x: (v.x * 0.5 + 0.5) * state.size.width,
            y: (-v.y * 0.5 + 0.5) * state.size.height,
          }
        }
      })

      leaderLinesHandle.update?.(anchors)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[0.60, 0.60, 0.60]}>
      {/* Structural Enclosure & Straps (Straps parented inside Casing shells) */}
      <CasingBottom progress={progress} />

      {/* 7 Active Hardware Subsystems */}
      <Battery progress={progress} />
      <Esp32Board progress={progress} />
      <TempSensor progress={progress} />
      <H2sSensor progress={progress} />
      <OledDisplay progress={progress} />
      <BuzzerLed progress={progress} />
      <CasingTop progress={progress} />
    </group>
  )
}

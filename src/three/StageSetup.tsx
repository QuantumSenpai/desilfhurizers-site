import { useRef } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { scrollState } from '../hooks/useScrollExplode'
import { SHOWCASE_PARTS } from '../data/components'
import { cameraTravelState } from './cameraTravelState'

interface StageSetupProps {
  children: ReactNode
}

export function StageSetup({ children }: StageSetupProps) {
  const activeSection = useStore((s) => s.activeSection)
  const isHero = activeSection === 'hero'

  const keyLightRef = useRef<THREE.DirectionalLight>(null)
  const fillLightRef = useRef<THREE.DirectionalLight>(null)
  const focusedRimLightRef = useRef<THREE.DirectionalLight>(null)
  const topSpotRef = useRef<THREE.SpotLight>(null)

  // Working target color for 60fps lerping
  const targetRimColor = useRef(new THREE.Color('#5B9BD5'))
  const neutralRimColor = useRef(new THREE.Color('#475569'))

  useFrame((_, delta) => {
    // 3-point Key Light: Crisp studio lighting with controlled specularity
    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.damp(
        keyLightRef.current.intensity,
        isHero ? 2.4 : 1.8,
        4,
        delta
      )
    }

    // 3-point Fill Light: Soft ambient bounce
    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.damp(
        fillLightRef.current.intensity,
        isHero ? 0.65 : 0.50,
        4,
        delta
      )
    }

    // Top Studio Downlight
    if (topSpotRef.current) {
      topSpotRef.current.intensity = THREE.MathUtils.damp(
        topSpotRef.current.intensity,
        isHero ? 1.2 : 0.9,
        4,
        delta
      )
    }

    // Dynamic Category-Colored Rim Light:
    // In Phase B isolation, dynamically picks up the focused part's locked category color
    // (DETECTION green, PROCESSING blue, OPTICS cyan, etc.) to bathe its silhouette in authentic rim light.
    if (focusedRimLightRef.current) {
      const rawFocus = scrollState.focusIndex
      const activeSec = useStore.getState().activeSection
      const isIsolation = rawFocus >= 0

      if (activeSec === 'principle') {
        const step = scrollState.principleStep ?? 0
        const stepColors = ['#22C55E', '#2F6FEF', '#2F6FEF']
        targetRimColor.current.set(stepColors[step] || '#22C55E')
        focusedRimLightRef.current.color.lerp(targetRimColor.current, Math.min(1, delta * 5))
        focusedRimLightRef.current.intensity = THREE.MathUtils.damp(
          focusedRimLightRef.current.intensity,
          2.6,
          5,
          delta
        )
      } else if (isIsolation) {
        const targetIdx = cameraTravelState.targetPartIndex >= 0
          ? cameraTravelState.targetPartIndex
          : Math.round(Math.max(0, Math.min(6, rawFocus)))
        const activePart = SHOWCASE_PARTS[targetIdx] || SHOWCASE_PARTS[0]
        targetRimColor.current.set(activePart.color)

        // Smoothly lerp rim light color to active category color
        focusedRimLightRef.current.color.lerp(targetRimColor.current, Math.min(1, delta * 5))
        focusedRimLightRef.current.intensity = THREE.MathUtils.damp(
          focusedRimLightRef.current.intensity,
          2.6,
          5,
          delta
        )
      } else {
        // Overview / Reassembly / Hero / Telemetry: Neutral cool rim
        focusedRimLightRef.current.color.lerp(neutralRimColor.current, Math.min(1, delta * 4))
        focusedRimLightRef.current.intensity = THREE.MathUtils.damp(
          focusedRimLightRef.current.intensity,
          1.4,
          4,
          delta
        )
      }
    }
  })

  return (
    <>
      {/* Procedural Studio Hemisphere Light — subtle sky/ground gradient */}
      <hemisphereLight
        args={['#F8FAFC', '#0B1120', isHero ? 0.45 : 0.55]}
      />

      {/* Balanced Studio Ambient Light — reduced to 0.38 to eliminate flat silhouette wash */}
      <ambientLight intensity={isHero ? 0.35 : 0.40} />

      {/* 3-Point Setup: 1. Key Light (Crisp studio light from upper left) */}
      <directionalLight
        ref={keyLightRef}
        position={[-5, 7, 5]}
        intensity={isHero ? 2.4 : 1.8}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* 3-Point Setup: 2. Fill Light (Soft cool bounce from lower right) */}
      <directionalLight
        ref={fillLightRef}
        position={[6, -2, 4]}
        intensity={isHero ? 0.65 : 0.50}
        color="#E2E8F0"
      />

      {/* 3-Point Setup: 3. Dynamic Category Rim Light (Silhouette edge lighting) */}
      <directionalLight
        ref={focusedRimLightRef}
        position={[1.5, 3.5, -4.5]}
        intensity={1.4}
        color="#5B9BD5"
      />

      {/* Top Accent Downlight */}
      <spotLight
        ref={topSpotRef}
        position={[0, 7, 2]}
        intensity={1.0}
        angle={0.75}
        penumbra={0.85}
        color="#F8FAFC"
      />

      {/* Ground Soft Contact Shadow (rendered once to save GPU buffers) */}
      <ContactShadows
        position={[0, -3.2, 0]}
        opacity={isHero ? 0.45 : 0.25}
        scale={12}
        blur={2.5}
        far={6}
        resolution={256}
        frames={1}
        color="#000000"
      />

      {children}
    </>
  )
}

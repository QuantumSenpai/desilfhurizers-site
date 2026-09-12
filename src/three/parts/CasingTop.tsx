import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../../state/store'
import { HARDWARE_PARTS } from '../../data/components'
import { PART_POSITIONS } from '../../data/explodePositions'
import { LeaderLineLabel } from '../../components/LeaderLineLabel'
import { getExplodeSeparation, getPartOpacityAndHighlight } from '../explodeUtils'
import { scrollState } from '../../hooks/useScrollExplode'
import { BandTop } from './BandTop'

interface PartProps {
  progress: number
}

const partData = HARDWARE_PARTS.find((p) => p.id === 'casing-top')!
const posConfig = PART_POSITIONS['casing-top']

export function CasingTop({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'casing-top'

  // Render-time values from snapped focusIndex — for JSX emissive only
  const { highlightFactor } = getPartOpacityAndHighlight(partData.id, focusIndex)
  const effectiveHighlight = isSelected ? 1.0 : highlightFactor

  // Canonical Exploded Position from Single Source of Truth
  const assembledPos = useMemo(() => new THREE.Vector3(...posConfig.assembled), [])
  const explodedPos = useMemo(() => new THREE.Vector3(...posConfig.exploded), [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { opacity, scale, settleOffset } = getPartOpacityAndHighlight(partData.id, scrollState.focusIndex)
    const isVis = opacity > 0.005
    groupRef.current.visible = isVis
    if (!isVis) return

    // Update material opacity frame-by-frame directly in WebGL — no React re-render lag
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (mat) {
          mat.transparent = true
          mat.opacity = opacity
        }
      }
    })

    const t = getExplodeSeparation(scrollState.explodeProgress ?? progress)
    const baseTargetX = THREE.MathUtils.lerp(assembledPos.x, explodedPos.x, t)
    const baseTargetY = THREE.MathUtils.lerp(assembledPos.y, explodedPos.y, t)
    const baseTargetZ = THREE.MathUtils.lerp(assembledPos.z, explodedPos.z, t)

    const targetX = THREE.MathUtils.lerp(baseTargetX, assembledPos.x, settleOffset)
    const targetY = THREE.MathUtils.lerp(baseTargetY, assembledPos.y, settleOffset)
    const targetZ = THREE.MathUtils.lerp(baseTargetZ, assembledPos.z, settleOffset)

    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 12, delta)
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 12, delta)
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 12, delta)

    groupRef.current.scale.setScalar(scale)

    // Subtle tilt only when exploding
    const targetRotX = THREE.MathUtils.lerp(0, 0.15, t)
    const targetRotY = THREE.MathUtils.lerp(0, -0.15, t)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 12, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 12, delta)
  })

  return (
    <group
      ref={groupRef}
      name="part-casing-top"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'casing-top')
      }}
    >
      {/* Upper Bezel Frame in XY plane */}
      <RoundedBox args={[2.3, 2.7, 0.18]} radius={0.25} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#22252A"
          metalness={0.7}
          roughness={0.4}
          transparent
          emissive="#6B7280"
          emissiveIntensity={effectiveHighlight * 0.45}
        />
      </RoundedBox>

      {/* Optical Sensor Aperture Ring (top-left) */}
      <mesh position={[-0.45, 0.35, 0.095]}>
        <ringGeometry args={[0.28, 0.38, 32]} />
        <meshStandardMaterial
          color="#6B7280"
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* Corner Fasteners */}
      {[
        [-0.95, 1.15, 0.095],
        [0.95, 1.15, 0.095],
        [-0.95, -1.15, 0.095],
        [0.95, -1.15, 0.095],
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 6]} />
          <meshStandardMaterial
            color="#CBD5E1"
            metalness={0.9}
            roughness={0.2}
            transparent
          />
        </mesh>
      ))}

      {/* Top Wristband Strap flush with casing */}
      <BandTop />

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="left" offset={[-1.1, 0.2, 0]} />
    </group>
  )
}

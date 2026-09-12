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
import { BandBottom } from './BandBottom'

interface PartProps {
  progress: number
}

const partData = HARDWARE_PARTS.find((p) => p.id === 'casing-bottom')!
const posConfig = PART_POSITIONS['casing-bottom']

export function CasingBottom({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'casing-bottom'

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

    const targetRotX = THREE.MathUtils.lerp(0, -0.2, t)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 12, delta)
  })

  return (
    <group
      ref={groupRef}
      name="part-casing-bottom"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'casing-bottom')
      }}
    >
      {/* Lower Enclosure Body */}
      <RoundedBox args={[2.3, 2.7, 0.18]} radius={0.22} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.7}
          roughness={0.4}
          transparent
          emissive="#6B7280"
          emissiveIntensity={effectiveHighlight * 0.4}
        />
      </RoundedBox>

      {/* Skin-Contact Central Optical / Sensor Window */}
      <mesh position={[0, 0, -0.095]}>
        <circleGeometry args={[0.38, 32]} />
        <meshStandardMaterial
          color="#0B0F19"
          metalness={0.8}
          roughness={0.2}
          transparent
        />
      </mesh>

      {/* Bottom Wristband Strap flush with casing */}
      <BandBottom />

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="left" offset={[-1.1, -0.2, 0]} />
    </group>
  )
}

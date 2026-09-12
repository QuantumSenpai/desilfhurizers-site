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

interface PartProps {
  progress: number
}

const partData = HARDWARE_PARTS.find((p) => p.id === 'battery')!
const posConfig = PART_POSITIONS['battery']

/**
 * 3.7V Micro Li-Po Battery Subsystem.
 * Real hardware: Soft rectangular pouch cell (25x20x5mm -> 1.40x1.70x0.12u),
 * silver mylar envelope with crimped perimeter seams, top Kapton/polyimide PCM tape,
 * and 2-wire red/black JST-PH connector pigtail.
 */
export function Battery({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const idleRotY = useRef(0)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'battery'

  const { highlightFactor } = getPartOpacityAndHighlight(partData.id, focusIndex)
  const effectiveHighlight = isSelected ? 1.0 : highlightFactor

  const assembledPos = useMemo(() => new THREE.Vector3(...posConfig.assembled), [])
  const explodedPos = useMemo(() => new THREE.Vector3(...posConfig.exploded), [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { opacity, scale, settleOffset, highlightFactor: dynamicHighlight } =
      getPartOpacityAndHighlight(partData.id, scrollState.focusIndex)
    const isVis = opacity > 0.005
    groupRef.current.visible = isVis
    if (!isVis) return

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (mat) {
          mat.transparent = true
          mat.opacity = opacity
          if (mat.emissive && mat.emissive.getHex() !== 0) {
            mat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 1.3, dynamicHighlight)
          }
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

    // Idle micro-rotation during isolation (5s per full revolution)
    const rawFocus = scrollState.focusIndex
    const isIsolated = rawFocus >= 0 && Math.abs(rawFocus - 5) < 0.45
    if (isIsolated) {
      idleRotY.current += delta * ((Math.PI * 2) / 5.0)
    } else {
      idleRotY.current = THREE.MathUtils.damp(idleRotY.current, 0, 8, delta)
    }

    const baseRotX = THREE.MathUtils.lerp(0, -0.15, t)
    const baseRotY = THREE.MathUtils.lerp(0, 0.2, t) + (isIsolated ? idleRotY.current : 0)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, baseRotX, 10, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, baseRotY, 10, delta)
  })

  return (
    <group
      ref={groupRef}
      name="part-battery"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'battery')
      }}
    >
      {/* Soft Rectangular Li-Po Pouch (25x20x5mm -> 1.40x1.70x0.12u) */}
      <RoundedBox args={[1.40, 1.70, 0.12]} radius={0.08} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#94A3B8"
          metalness={0.7}
          roughness={0.35}
          transparent
          emissive="#F97316"
          emissiveIntensity={effectiveHighlight * 0.3}
        />
      </RoundedBox>

      {/* Sealed Perimeter Seam Flange */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.52, 1.82, 0.01]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.4} transparent />
      </mesh>

      {/* Polyimide (Kapton) Yellow Insulating Tape over Top Protection Circuit */}
      <mesh position={[0, 0.72, 0.065]}>
        <boxGeometry args={[1.32, 0.24, 0.02]} />
        <meshStandardMaterial
          color="#D97706"
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 2-Wire JST-PH Connector Pigtail (Red + / Black -) */}
      <group position={[0.35, 0.88, 0.04]}>
        {/* Red Lead Wire */}
        <mesh position={[-0.06, 0.08, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 12]} />
          <meshStandardMaterial color="#EF4444" roughness={0.5} transparent />
        </mesh>
        {/* Black Lead Wire */}
        <mesh position={[0.06, 0.08, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 12]} />
          <meshStandardMaterial color="#18181B" roughness={0.5} transparent />
        </mesh>
        {/* White JST-PH 2.0 Housing */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.22, 0.10, 0.12]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.1} transparent />
        </mesh>
      </group>

      {/* Charge Status Bar Accent — Orange Glow */}
      <mesh position={[-0.52, -0.1, 0.065]}>
        <boxGeometry args={[0.06, 1.10, 0.01]} />
        <meshStandardMaterial
          color="#F97316"
          emissive="#F97316"
          emissiveIntensity={1.4 + effectiveHighlight}
          transparent
        />
      </mesh>

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="left" offset={[-0.85, 0.1, 0]} />
    </group>
  )
}

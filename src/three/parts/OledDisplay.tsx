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

const partData = HARDWARE_PARTS.find((p) => p.id === 'oled-display')!
const posConfig = PART_POSITIONS['oled-display']

/**
 * 1.3" OLED Display Subsystem (SH1106).
 * Real hardware: Module carrier board (34.5x23.0x1.4mm -> 1.70x1.15x0.06u),
 * protective display glass with active matrix screen area (29.4x14.7mm -> 1.45x0.75u),
 * and 4-pin header row (GND, VDD, SCK, SDA) along bottom edge.
 */
export function OledDisplay({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const idleRotY = useRef(0)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'oled-display'

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
            mat.emissiveIntensity = THREE.MathUtils.lerp(0.15, 1.4, dynamicHighlight)
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
    const isIsolated = rawFocus >= 0 && Math.abs(rawFocus - 4) < 0.45
    if (isIsolated) {
      idleRotY.current += delta * ((Math.PI * 2) / 5.0)
    } else {
      idleRotY.current = THREE.MathUtils.damp(idleRotY.current, 0, 8, delta)
    }

    const baseRotY = THREE.MathUtils.lerp(0, 0.25, t) + (isIsolated ? idleRotY.current : 0)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, baseRotY, 10, delta)
  })

  return (
    <group
      ref={groupRef}
      name="part-oled-display"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'oled-display')
      }}
    >
      {/* Carrier PCB (34.5 x 23.0 x 1.4mm -> 1.70 x 1.15 x 0.06u) */}
      <RoundedBox args={[1.70, 1.15, 0.06]} radius={0.04} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#0F172A"
          metalness={0.4}
          roughness={0.35}
          transparent
          emissive="#0891B2"
          emissiveIntensity={effectiveHighlight * 0.3}
        />
      </RoundedBox>

      {/* Display Glass Frame with Thin Bezel */}
      <mesh position={[0, 0.06, 0.035]}>
        <boxGeometry args={[1.56, 0.92, 0.02]} />
        <meshPhysicalMaterial
          color="#0B0F19"
          metalness={0.8}
          roughness={0.15}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          transparent
        />
      </mesh>

      {/* Active Matrix Graphic Area (1.45 x 0.75u) */}
      <mesh position={[0, 0.06, 0.046]}>
        <boxGeometry args={[1.42, 0.72, 0.005]} />
        <meshPhysicalMaterial
          color="#042F2E"
          emissive="#0891B2"
          emissiveIntensity={0.65 + effectiveHighlight * 0.7}
          roughness={0.12}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          transparent
        />
      </mesh>

      {/* Simulated Screen UI Readings (PPM numeric display & alert badge) */}
      <mesh position={[-0.24, 0.16, 0.052]}>
        <boxGeometry args={[0.75, 0.12, 0.004]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#38BDF8"
          emissiveIntensity={1.4 + effectiveHighlight * 0.5}
          transparent
        />
      </mesh>
      <mesh position={[0.34, 0.16, 0.052]}>
        <boxGeometry args={[0.28, 0.10, 0.004]} />
        <meshStandardMaterial
          color="#22C55E"
          emissive="#22C55E"
          emissiveIntensity={1.2 + effectiveHighlight * 0.4}
          transparent
        />
      </mesh>
      <mesh position={[0, -0.06, 0.052]}>
        <boxGeometry args={[1.15, 0.08, 0.004]} />
        <meshStandardMaterial
          color="#0891B2"
          emissive="#0891B2"
          emissiveIntensity={0.9}
          transparent
        />
      </mesh>

      {/* 4-Pin Header along bottom edge (GND, VDD, SCK, SDA) */}
      {[-0.24, -0.08, 0.08, 0.24].map((x, idx) => (
        <mesh key={idx} position={[x, -0.50, 0.03]}>
          <boxGeometry args={[0.06, 0.08, 0.05]} />
          <meshStandardMaterial color="#FBBF24" metalness={0.9} roughness={0.1} transparent />
        </mesh>
      ))}

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="right" offset={[0.85, 0.15, 0]} />
    </group>
  )
}

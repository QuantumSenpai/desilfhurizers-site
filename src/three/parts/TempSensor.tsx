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

const partData = HARDWARE_PARTS.find((p) => p.id === 'temp-sensor')!
const posConfig = PART_POSITIONS['temp-sensor']

/**
 * SHT30 Precision Temperature & Relative Humidity Sensor.
 * Real hardware: Compact breakout PCB (12x10x2mm) with central SHT30 DFN package (2.5x2.5mm),
 * metallic sensing aperture filter, SMD passives, and 4-pin header row (VCC, GND, SDA, SCL).
 */
export function TempSensor({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const idleRotY = useRef(0)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'temp-sensor'

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
    const isIsolated = rawFocus >= 0 && Math.abs(rawFocus - 2) < 0.45
    if (isIsolated) {
      idleRotY.current += delta * ((Math.PI * 2) / 5.0)
    } else {
      idleRotY.current = THREE.MathUtils.damp(idleRotY.current, 0, 8, delta)
    }

    const baseRotX = THREE.MathUtils.lerp(0, 0.15, t)
    const baseRotY = THREE.MathUtils.lerp(0, 0.2, t) + (isIsolated ? idleRotY.current : 0)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, baseRotX, 10, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, baseRotY, 10, delta)
  })

  return (
    <group
      ref={groupRef}
      name="part-temp-sensor"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'temp-sensor')
      }}
    >
      {/* SHT30 Breakout Carrier PCB (12 x 10mm -> 0.60 x 0.50 x 0.05) */}
      <RoundedBox args={[0.60, 0.50, 0.05]} radius={0.03} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#18181B"
          metalness={0.3}
          roughness={0.4}
          transparent
          emissive="#EAB308"
          emissiveIntensity={effectiveHighlight * 0.35}
        />
      </RoundedBox>

      {/* SHT30 Central Sensor IC Package (2.5 x 2.5mm -> 0.15 x 0.15 x 0.03) */}
      <RoundedBox args={[0.18, 0.18, 0.035]} radius={0.01} smoothness={2} position={[0, 0.04, 0.035]}>
        <meshStandardMaterial
          color="#27272A"
          metalness={0.7}
          roughness={0.3}
          transparent
          emissive="#EAB308"
          emissiveIntensity={effectiveHighlight * 0.4}
        />
      </RoundedBox>

      {/* PTFE Protective Membrane / Metallic Vent Aperture */}
      <mesh position={[0, 0.04, 0.054]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial
          color="#CA8A04"
          metalness={0.9}
          roughness={0.2}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* Decoupling Passives & Resistors */}
      <mesh position={[-0.18, 0.04, 0.032]}>
        <boxGeometry args={[0.06, 0.10, 0.02]} />
        <meshStandardMaterial color="#71717A" metalness={0.8} roughness={0.3} transparent />
      </mesh>
      <mesh position={[0.18, 0.04, 0.032]}>
        <boxGeometry args={[0.06, 0.10, 0.02]} />
        <meshStandardMaterial color="#71717A" metalness={0.8} roughness={0.3} transparent />
      </mesh>

      {/* 4-Pin Solder Header along bottom edge (VCC, GND, SDA, SCL) */}
      {[-0.18, -0.06, 0.06, 0.18].map((x, idx) => (
        <mesh key={idx} position={[x, -0.20, 0.03]}>
          <boxGeometry args={[0.05, 0.05, 0.04]} />
          <meshStandardMaterial color="#FBBF24" metalness={0.9} roughness={0.1} transparent />
        </mesh>
      ))}

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="right" offset={[0.35, 0.15, 0]} />
    </group>
  )
}

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

const partData = HARDWARE_PARTS.find((p) => p.id === 'h2s-sensor')!
const posConfig = PART_POSITIONS['h2s-sensor']

/**
 * Fermion MEMS H2S Sensor Subsystem.
 * Real hardware: DFRobot Fermion carrier PCB (18x18mm) with compact MEMS gas sensor (13x13x2.5mm),
 * circular gas permeation intake, gold contact pads, and 4-pin header row.
 */
export function H2sSensor({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const idleRotY = useRef(0)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'h2s-sensor'

  // Render-time values from snapped focusIndex — for JSX emissive only
  const { highlightFactor } = getPartOpacityAndHighlight(partData.id, focusIndex)
  const effectiveHighlight = isSelected ? 1.0 : highlightFactor

  // Canonical Exploded Position from Single Source of Truth
  const assembledPos = useMemo(() => new THREE.Vector3(...posConfig.assembled), [])
  const explodedPos = useMemo(() => new THREE.Vector3(...posConfig.exploded), [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { opacity, scale, settleOffset, highlightFactor: dynamicHighlight } =
      getPartOpacityAndHighlight(partData.id, scrollState.focusIndex)
    const isVis = opacity > 0.005
    groupRef.current.visible = isVis
    if (!isVis) return

    // Update material opacity and emissive highlight frame-by-frame directly in WebGL
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
    const isIsolated = rawFocus >= 0 && Math.abs(rawFocus - 1) < 0.45
    if (isIsolated) {
      idleRotY.current += delta * ((Math.PI * 2) / 5.0)
    } else {
      idleRotY.current = THREE.MathUtils.damp(idleRotY.current, 0, 8, delta)
    }

    const baseRotX = THREE.MathUtils.lerp(0, 0.2, t)
    const baseRotY = THREE.MathUtils.lerp(0, -0.2, t) + (isIsolated ? idleRotY.current : 0)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, baseRotX, 10, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, baseRotY, 10, delta)
  })

  return (
    <group
      ref={groupRef}
      name="part-h2s-sensor"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'h2s-sensor')
      }}
    >
      {/* Fermion Square Breakout Carrier PCB (18x18mm typ) */}
      <RoundedBox args={[0.90, 0.90, 0.06]} radius={0.04} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#0B1C14"
          metalness={0.3}
          roughness={0.4}
          transparent
          emissive="#22C55E"
          emissiveIntensity={effectiveHighlight * 0.35}
        />
      </RoundedBox>

      {/* DFRobot Fermion Silkscreen Branding Area Panel Detail */}
      <mesh position={[0, 0.32, 0.032]}>
        <boxGeometry args={[0.74, 0.12, 0.005]} />
        <meshStandardMaterial
          color="#166534"
          metalness={0.2}
          roughness={0.6}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* MEMS Sensor Metal Canister Package (13x13x2.5mm typ) */}
      <RoundedBox args={[0.65, 0.65, 0.10]} radius={0.05} smoothness={4} position={[0, -0.04, 0.06]}>
        <meshStandardMaterial
          color="#64748B"
          metalness={0.85}
          roughness={0.25}
          transparent
          emissive="#22C55E"
          emissiveIntensity={effectiveHighlight * 0.45}
        />
      </RoundedBox>

      {/* Circular Gas Permeation Intake Screen Bezel */}
      <mesh position={[0, -0.04, 0.112]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.015, 32]} />
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.9}
          roughness={0.2}
          transparent
        />
      </mesh>

      {/* Reagent Colorimetric Sensing Disc */}
      <mesh position={[0, -0.04, 0.122]}>
        <circleGeometry args={[0.18, 32]} />
        <meshStandardMaterial
          color="#DEE7A7"
          roughness={0.6}
          metalness={0.1}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* Micro-Mesh Gas Permeation Screen Pattern */}
      <mesh position={[0, -0.04, 0.124]}>
        <ringGeometry args={[0.08, 0.16, 24]} />
        <meshStandardMaterial
          color="#94A3B8"
          metalness={0.7}
          roughness={0.3}
          wireframe
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* 4-Pin Breakout Header along bottom edge */}
      {[-0.24, -0.08, 0.08, 0.24].map((x, idx) => (
        <mesh key={idx} position={[x, -0.38, 0.04]}>
          <boxGeometry args={[0.06, 0.06, 0.08]} />
          <meshStandardMaterial
            color="#FBBF24"
            metalness={0.9}
            roughness={0.2}
            transparent
          />
        </mesh>
      ))}

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="left" offset={[-0.5, 0.25, 0]} />
    </group>
  )
}

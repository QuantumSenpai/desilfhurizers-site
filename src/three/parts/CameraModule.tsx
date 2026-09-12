import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
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

const partData = HARDWARE_PARTS.find((p) => p.id === 'camera-module')!
const posConfig = PART_POSITIONS['camera-module']

export function CameraModule({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const idleRotY = useRef(0)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'camera-module'

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
    const isIsolated = rawFocus >= 0 && Math.abs(rawFocus - 2) < 0.45
    if (isIsolated) {
      idleRotY.current += delta * ((Math.PI * 2) / 5.0)
    } else {
      idleRotY.current = THREE.MathUtils.damp(idleRotY.current, 0, 8, delta)
    }

    const baseRotX = THREE.MathUtils.lerp(0, 0.18, t)
    const baseRotY = THREE.MathUtils.lerp(0, 0.22, t) + (isIsolated ? idleRotY.current : 0)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, baseRotX, 10, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, baseRotY, 10, delta)
  })

  return (
    <group
      ref={groupRef}
      name="part-camera-module"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'camera-module')
      }}
    >
      {/* CMOS PCB Carrier Board */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.55, 0.55, 0.08]} />
        <meshStandardMaterial
          color="#0F172A"
          metalness={0.6}
          roughness={0.4}
          transparent
          emissive="#059669"
          emissiveIntensity={effectiveHighlight * 0.4}
        />
      </mesh>

      {/* Optics Category Ring (#059669) */}
      <mesh position={[0, 0, 0.042]}>
        <ringGeometry args={[0.22, 0.25, 32]} />
        <meshStandardMaterial
          color="#059669"
          emissive="#059669"
          emissiveIntensity={0.8 + effectiveHighlight * 0.6}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* Stepped Cylindrical Lens Barrel facing +Z */}
      <mesh position={[0, 0, 0.10]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.21, 0.12, 32]} />
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.85}
          roughness={0.25}
          transparent
        />
      </mesh>

      {/* Lens Bezel Ring */}
      <mesh position={[0, 0, 0.165]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.02, 32]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.9}
          roughness={0.15}
          transparent
        />
      </mesh>

      {/* Optical Anti-Reflective Lens Face */}
      <mesh position={[0, 0, 0.176]}>
        <circleGeometry args={[0.13, 32]} />
        <meshPhysicalMaterial
          color="#064E3B"
          emissive="#059669"
          emissiveIntensity={0.3 + effectiveHighlight * 0.5}
          metalness={0.95}
          roughness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          transparent
        />
      </mesh>

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="right" offset={[0.4, 0.2, 0]} />
    </group>
  )
}

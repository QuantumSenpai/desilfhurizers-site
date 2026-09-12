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

const partData = HARDWARE_PARTS.find((p) => p.id === 'buzzer-led')!
const posConfig = PART_POSITIONS['buzzer-led']

export function BuzzerLed({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  const idleRotY = useRef(0)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'buzzer-led'

  // Render-time values from snapped focusIndex — for JSX emissive only
  const { highlightFactor } = getPartOpacityAndHighlight(partData.id, focusIndex)
  const effectiveHighlight = isSelected ? 1.0 : highlightFactor

  // Canonical Exploded Position from Single Source of Truth
  const assembledPos = useMemo(() => new THREE.Vector3(...posConfig.assembled), [])
  const explodedPos = useMemo(() => new THREE.Vector3(...posConfig.exploded), [])

  useFrame((state, delta) => {
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
    const isIsolated = rawFocus >= 0 && Math.abs(rawFocus - 3) < 0.45
    if (isIsolated) {
      idleRotY.current += delta * ((Math.PI * 2) / 5.0)
    } else {
      idleRotY.current = THREE.MathUtils.damp(idleRotY.current, 0, 8, delta)
    }

    const baseRotX = THREE.MathUtils.lerp(0, 0.2, t)
    const baseRotY = THREE.MathUtils.lerp(0, -0.25, t) + (isIsolated ? idleRotY.current : 0)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, baseRotX, 10, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, baseRotY, 10, delta)

    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.3 + 0.9
      mat.emissiveIntensity = pulse
    }
  })

  return (
    <group
      ref={groupRef}
      name="part-buzzer-led"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'buzzer-led')
      }}
    >
      {/* Piezo Sounder Cylinder facing +Z */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.1, 24]} />
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.7}
          roughness={0.4}
          transparent
          emissive="#E5484D"
          emissiveIntensity={effectiveHighlight * 0.4}
        />
      </mesh>

      {/* Acoustic Sound Aperture */}
      <mesh position={[0, 0, 0.052]}>
        <circleGeometry args={[0.06, 16]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.9} transparent />
      </mesh>

      {/* Tri-Color RGB Micro Alert LED */}
      <mesh ref={ledRef} position={[0.3, 0, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.08]} />
        <meshStandardMaterial
          color="#22C55E"
          emissive="#22C55E"
          emissiveIntensity={1.0 + effectiveHighlight * 0.5}
          roughness={0.2}
          transparent
        />
      </mesh>

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="left" offset={[-0.4, 0.15, 0]} />
    </group>
  )
}

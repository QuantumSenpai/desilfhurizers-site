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

const partData = HARDWARE_PARTS.find((p) => p.id === 'esp32')!
const posConfig = PART_POSITIONS['esp32']

/**
 * Seeed XIAO ESP32S3 (Sense) Microcontroller Subsystem.
 * Real hardware: Compact 21x17.5mm base board with castellated pins, USB-C port,
 * reset/boot buttons, and stacked camera/mic sensor daughterboard on top.
 */
export function Esp32Board({ progress }: PartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const idleRotY = useRef(0)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const focusIndex = useStore((s) => s.focusIndex)
  const isSelected = selectedPartId === 'esp32'

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
    const isIsolated = rawFocus >= 0 && Math.abs(rawFocus - 0) < 0.45
    if (isIsolated) {
      idleRotY.current += delta * ((Math.PI * 2) / 5.0)
    } else {
      idleRotY.current = THREE.MathUtils.damp(idleRotY.current, 0, 8, delta)
    }

    const baseRotX = THREE.MathUtils.lerp(0, 0.12, t)
    const baseRotY = THREE.MathUtils.lerp(0, -0.18, t) + (isIsolated ? idleRotY.current : 0)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, baseRotX, 10, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, baseRotY, 10, delta)
  })

  return (
    <group
      ref={groupRef}
      name="part-esp32"
      onClick={(e) => {
        e.stopPropagation()
        setSelectedPartId(isSelected ? null : 'esp32')
      }}
    >
      {/* Base XIAO PCB Substrate (21 x 17.5mm scaled to 1.05 x 0.88 x 0.06) */}
      <RoundedBox args={[1.05, 0.88, 0.06]} radius={0.03} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.4}
          metalness={0.2}
          transparent
          emissive="#2F6FEF"
          emissiveIntensity={effectiveHighlight * 0.4}
        />
      </RoundedBox>

      {/* Castellated Edge Solder Pads along both long edges */}
      {[-0.50, 0.50].map((x, i) => (
        <group key={i} position={[x, 0, 0.032]}>
          {[-0.36, -0.24, -0.12, 0.0, 0.12, 0.24, 0.36].map((y, j) => (
            <mesh key={j} position={[0, y, 0]}>
              <boxGeometry args={[0.07, 0.07, 0.01]} />
              <meshStandardMaterial color="#FBBF24" metalness={0.9} roughness={0.2} transparent />
            </mesh>
          ))}
        </group>
      ))}

      {/* USB-C Receptacle on bottom short edge */}
      <mesh position={[0, -0.44, 0.045]}>
        <boxGeometry args={[0.34, 0.14, 0.08]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} transparent />
      </mesh>

      {/* ESP32-S3 Metal RF Shield Can on Base Board */}
      <mesh position={[-0.12, 0.04, 0.045]}>
        <boxGeometry args={[0.55, 0.55, 0.06]} />
        <meshStandardMaterial
          color="#CBD5E1"
          metalness={0.85}
          roughness={0.25}
          transparent
          emissive="#2F6FEF"
          emissiveIntensity={effectiveHighlight * 0.3}
        />
      </mesh>

      {/* Tiny Buttons (BOOT & RESET) */}
      <mesh position={[-0.38, 0.34, 0.04]}>
        <boxGeometry args={[0.08, 0.08, 0.04]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} transparent />
      </mesh>
      <mesh position={[0.38, 0.34, 0.04]}>
        <boxGeometry args={[0.08, 0.08, 0.04]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} transparent />
      </mesh>

      {/* Stacked Sense Daughterboard mounted on header pins */}
      <group position={[0, 0.05, 0.09]}>
        {/* Sub-board PCB */}
        <RoundedBox args={[0.85, 0.70, 0.04]} radius={0.02} smoothness={4} position={[0, 0, 0]}>
          <meshStandardMaterial color="#091824" roughness={0.4} metalness={0.3} transparent />
        </RoundedBox>

        {/* Small Round Camera Lens Element on Daughterboard */}
        <mesh position={[0.15, 0.05, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} transparent />
        </mesh>
        <mesh position={[0.15, 0.05, 0.056]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
          <meshStandardMaterial color="#0284C7" emissive="#0284C7" emissiveIntensity={0.6} metalness={0.9} roughness={0.1} transparent />
        </mesh>

        {/* Microphone Sound Port Detail */}
        <mesh position={[-0.24, 0.18, 0.025]}>
          <cylinderGeometry args={[0.03, 0.03, 0.01, 12]} />
          <meshStandardMaterial color="#FBBF24" metalness={0.9} roughness={0.2} transparent />
        </mesh>
      </group>

      {/* Glowing BLE Transmitter Point (#2F6FEF) */}
      <mesh position={[0.32, 0.36, 0.04]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial
          color="#2F6FEF"
          emissive="#2F6FEF"
          emissiveIntensity={1.8}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* 3D Leader Line Label */}
      <LeaderLineLabel part={partData} side="left" offset={[-0.9, 0.1, 0]} />
    </group>
  )
}

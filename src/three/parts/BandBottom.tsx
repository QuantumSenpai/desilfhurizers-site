/**
 * Bottom Wristband Strap.
 * Parented directly to CasingBottom — static geometry with zero relative offset when assembled.
 * Inherits CasingBottom transforms and opacity traversal.
 */
export function BandBottom() {
  const segments = [
    { y: -1.5, z: -0.05, rx: 0.06, len: 0.35 },
    { y: -1.85, z: -0.15, rx: 0.15, len: 0.35 },
    { y: -2.2, z: -0.32, rx: 0.28, len: 0.35 },
    { y: -2.55, z: -0.58, rx: 0.42, len: 0.35 },
    { y: -2.88, z: -0.92, rx: 0.58, len: 0.35 },
  ]

  return (
    <group position={[0, 0, 0.15]}>
      {/* Quick-Release Stainless Lug Bar attached flush to casing bottom lug at Y = -1.35 */}
      <mesh position={[0, -1.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.9, 16]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.2} transparent />
      </mesh>

      {/* Strap Segments extending down -Y and curving back -Z */}
      {segments.map((seg, idx) => (
        <group key={idx} position={[0, seg.y, seg.z]} rotation={[seg.rx, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.8, seg.len, 0.12]} />
            <meshStandardMaterial color="#1E232B" roughness={0.8} metalness={0.1} transparent />
          </mesh>
        </group>
      ))}
    </group>
  )
}

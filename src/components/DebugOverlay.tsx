import { useEffect, useState, useRef } from 'react'
import { useStore } from '../state/store'

export function DebugOverlay() {
  const [showDebug, setShowDebug] = useState(false)
  const [fps, setFps] = useState(60)
  const explodeProgress = useStore((s) => s.explodeProgress)
  const activeSection = useStore((s) => s.activeSection)
  const cameraPosition = useStore((s) => s.cameraPosition)

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    // Check if ?debug=1 is in query parameters
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') === '1') {
      setShowDebug(true)
    }

    // Measure FPS
    let animId: number
    const calcFps = () => {
      frameCountRef.current++
      const now = performance.now()
      if (now - lastTimeRef.current >= 500) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)))
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
      animId = requestAnimationFrame(calcFps)
    }
    animId = requestAnimationFrame(calcFps)

    return () => cancelAnimationFrame(animId)
  }, [])

  if (!showDebug) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 999,
        backgroundColor: 'rgba(10, 10, 10, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#22C55E',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        lineHeight: 1.6,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        userSelect: 'none',
        minWidth: '220px',
      }}
    >
      <div style={{ color: '#F5F5F3', fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
        DIAGNOSTICS [?debug=1]
      </div>
      <div>
        <span style={{ color: '#9CA3AF' }}>SECTION: </span>
        <span style={{ color: '#38BDF8', fontWeight: 600 }}>{activeSection.toUpperCase()}</span>
      </div>
      <div>
        <span style={{ color: '#9CA3AF' }}>EXPLODE: </span>
        <span style={{ color: '#FACC15', fontWeight: 600 }}>{explodeProgress.toFixed(3)}</span>
      </div>
      <div>
        <span style={{ color: '#9CA3AF' }}>CAM XYZ: </span>
        <span style={{ color: '#E2E8F0' }}>
          [{cameraPosition[0].toFixed(2)}, {cameraPosition[1].toFixed(2)}, {cameraPosition[2].toFixed(2)}]
        </span>
      </div>
      <div>
        <span style={{ color: '#9CA3AF' }}>PERF: </span>
        <span style={{ color: fps >= 55 ? '#22C55E' : fps >= 30 ? '#FACC15' : '#EF4444', fontWeight: 600 }}>
          {fps} FPS
        </span>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { Layers } from 'lucide-react'

export function ExplodedHardware() {
  const sectionRef = useRef<HTMLElement>(null)
  const setActiveSection = useStore((s) => s.setActiveSection)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // Section 8: IntersectionObserver for Edge & Firefox
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection('hardware')
            setHasEntered(true)
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [setActiveSection])

  const focusIndex = useStore((s) => s.focusIndex)
  // Gated strictly to Phase A (focusIndex === -1); does not pop in during Phase C reassembly (-2)
  const isOverview = focusIndex === -1

  return (
    <section
      id="hardware"
      ref={sectionRef}
      className="relative w-full h-screen min-h-screen text-[#0B0F19] select-none overflow-hidden bg-transparent"
    >
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none z-0" />

      {/* Overview Heading (Visible during Phase A: Full Exploded Overview, fades out during isolation) */}
      <div
        className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 text-center pointer-events-none transition-all duration-500 ease-out"
        style={{
          opacity: hasEntered && isOverview ? 1 : 0,
          transform: hasEntered && isOverview ? 'translate(-50%, 0)' : 'translate(-50%, -16px)',
        }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-black/10 text-[#2F6FEF] font-mono text-[12px] tracking-widest uppercase mb-3 shadow-xs backdrop-blur-md font-bold">
          <Layers className="w-3.5 h-3.5" />
          <span>03 // EXPLODED HARDWARE ARCHITECTURE</span>
        </div>

        <h2 className="text-[clamp(32px,4.2vw,52px)] font-black tracking-tight text-[#0B0F19] leading-tight mb-3">
          MODULAR SUBSYSTEM STACK.
        </h2>

        <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-xl mx-auto">
          Full 8-layer industrial dosimeter architecture. Scroll to isolate and inspect each subsystem with real-time on-device telemetry.
        </p>
      </div>
    </section>
  )
}

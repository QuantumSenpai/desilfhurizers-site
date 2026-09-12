import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { HARDWARE_PARTS } from '../data/components'
import { Feather, Sparkles } from 'lucide-react'

export function LightweightDesign() {
  const sectionRef = useRef<HTMLElement>(null)
  const setActiveSection = useStore((s) => s.setActiveSection)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // Section 8: IntersectionObserver for Edge/Firefox compatibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection('design')
            setHasEntered(true)
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [setActiveSection])

  return (
    <section
      id="design"
      ref={sectionRef}
      className="relative w-full min-h-screen text-[#0B0F19] flex items-center select-none overflow-hidden bg-transparent py-24"
    >
      <div className="w-full flex flex-col lg:flex-row items-center justify-between relative z-30 px-6 sm:px-12 lg:px-0">
        {/* ================= LEFT COLUMN: Text Content (0 to 42vw) ================= */}
        <div className="w-full lg:w-[42vw] flex flex-col justify-center lg:pl-[80px] lg:pr-4 z-30">
          
          {/* Section Label */}
          <div
            className="inline-flex items-center gap-2 self-start font-mono text-[12px] tracking-widest uppercase text-[#2F6FEF] mb-6 transition-all duration-600 ease-out px-4 py-1.5 rounded-full bg-black/5 border border-black/10 shadow-xs font-bold"
            style={{
              opacity: hasEntered ? 1 : 0,
              transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '0s',
            }}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>01 // INDUSTRIAL ERGONOMICS</span>
          </div>

          {/* H2 Headline */}
          <h2
            className="text-[clamp(36px,4.5vw,60px)] font-black tracking-tight text-[#0B0F19] leading-[0.95] mb-6 transition-all duration-600 ease-out"
            style={{
              opacity: hasEntered ? 1 : 0,
              transform: hasEntered ? 'translateY(0)' : 'translateY(28px)',
              transitionDelay: '0.05s',
            }}
          >
            ENGINEERED FOR CONTINUOUS INDUSTRIAL SHIFTS.
          </h2>

          {/* Body */}
          <p
            className="text-[16.5px] text-[#4B5563] leading-[1.75] max-w-[380px] mb-8 transition-all duration-600 ease-out"
            style={{
              opacity: hasEntered ? 1 : 0,
              transform: hasEntered ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '0.15s',
            }}
          >
            Designed for hazardous industrial facilities—petrochemical refineries, wastewater processing, and enclosed utility zones.
            Features a durable polymer housing, sealed enclosure against dust and moisture, and an integrated rechargeable battery
            powering full-shift monitoring without impeding worker agility.
          </p>

          {/* 3 Spec Tiles (Form Factor, Chassis, Power) */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[440px] mb-8">
            {[
              { label: 'FORM FACTOR', value: 'Wristband', sub: 'Low-profile wear', delay: '0.15s' },
              { label: 'CHASSIS', value: 'Sealed', sub: 'Durable polymer', delay: '0.20s' },
              { label: 'POWER', value: 'Internal', sub: 'Rechargeable cell', delay: '0.25s' },
            ].map((tile, i) => (
              <div
                key={i}
                className="bg-white border border-black/[0.08] rounded-[10px] p-[14px_16px] shadow-sm transition-all duration-500 ease-out"
                style={{
                  opacity: hasEntered ? 1 : 0,
                  transform: hasEntered ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: tile.delay,
                }}
              >
                <div className="font-mono text-[11px] text-[#6B7280] uppercase font-bold">{tile.label}</div>
                <div className="text-[18px] font-bold text-[#0B0F19] mt-1">{tile.value}</div>
                <div className="text-[13px] text-[#6B7280] mt-0.5 truncate">{tile.sub}</div>
              </div>
            ))}
          </div>

          {/* Subsystem Matrix Card */}
          <div
            className="w-full max-w-[440px] bg-white border border-black/[0.08] rounded-[12px] p-[20px] shadow-sm transition-all duration-500 ease-out"
            style={{
              opacity: hasEntered ? 1 : 0,
              transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '0.30s',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#2F6FEF]" />
                <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#6B7280]">
                  SUBSYSTEM MATRIX
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#6B7280] font-medium">
                ALL 8 SUBSYSTEMS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {HARDWARE_PARTS.map((part) => {
                const isSelected = selectedPartId === part.id
                return (
                  <div
                    key={part.id}
                    onClick={() => setSelectedPartId(isSelected ? null : part.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#2F6FEF]/10 border border-[#2F6FEF]/40'
                        : 'hover:bg-black/5 border border-transparent'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: part.color }}
                    />
                    <span className="text-[14px] font-medium text-[#0B0F19] truncate">
                      {part.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Center 2% Breathing Room (42vw to 44vw) */}
        <div className="hidden lg:block w-[2vw] pointer-events-none" />

        {/* ================= RIGHT COLUMN: 3D Model Area (44vw to 100vw) ================= */}
        <div className="w-full lg:w-[56vw] min-h-[400px] lg:min-h-screen pointer-events-none" />
      </div>
    </section>
  )
}

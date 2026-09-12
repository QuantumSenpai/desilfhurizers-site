import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { Radio } from 'lucide-react'
import { lastScreenAnchors } from './LeaderLinesOverlay'

export function ConnectivitySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const phoneBleDotRef = useRef<HTMLDivElement>(null)
  const setActiveSection = useStore((s) => s.setActiveSection)
  const [isVisible, setIsVisible] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [bleCoords, setBleCoords] = useState<{ pX: number; pY: number; wX: number; wY: number } | null>(null)

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'active'>('connecting')

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection('connectivity')
            setHasEntered(true)
            setIsVisible(true)
            // Brief pairing transition on scroll entry
            setTimeout(() => {
              setConnectionStatus('active')
            }, 1200)
          } else {
            setIsVisible(false)
            setConnectionStatus('connecting')
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [setActiveSection])

  // BLE anchor calculation — only runs while section is visible in viewport
  // Gated to avoid continuous getBoundingClientRect thrash when user is elsewhere on page
  useEffect(() => {
    if (!isVisible) return
    let animId: number

    const updateAnchors = () => {
      if (rowRef.current && phoneBleDotRef.current) {
        const rowRect = rowRef.current.getBoundingClientRect()
        const dotRect = phoneBleDotRef.current.getBoundingClientRect()

        const pX = Math.round(dotRect.left - rowRect.left + dotRect.width / 2)
        const pY = Math.round(dotRect.top - rowRect.top + dotRect.height / 2)

        let wX = Math.round(rowRect.width * 0.72)
        let wY = Math.round(rowRect.height * 0.48)

        if (lastScreenAnchors['esp32'] && lastScreenAnchors['esp32'].x > 0) {
          wX = Math.round(lastScreenAnchors['esp32'].x - rowRect.left)
          wY = Math.round(lastScreenAnchors['esp32'].y - rowRect.top)
        }

        setBleCoords({ pX, pY, wX, wY })
      }

      animId = requestAnimationFrame(updateAnchors)
    }

    animId = requestAnimationFrame(updateAnchors)
    return () => cancelAnimationFrame(animId)
  }, [isVisible])

  return (
    <section
      id="connectivity"
      ref={sectionRef}
      className="relative w-full min-h-screen text-[#0B0F19] flex flex-col justify-center select-none overflow-hidden bg-transparent py-28"
    >
      <div className="w-full relative z-30 px-6 sm:px-12 lg:px-0">
        {/* Main Section Row: Left (Phone Mockup + Specs) and Right (Assembled 3D Watch Area) */}
        <div ref={rowRef} className="flex flex-col lg:flex-row items-center justify-between relative">
          {/* ================= LEFT COLUMN: Text & Phone Mockup ================= */}
          <div className="w-full lg:w-[46vw] flex flex-col items-start lg:pl-[80px] lg:pr-4 z-30">
            {/* Section Header */}
            <div
              className="inline-flex items-center gap-2 self-start font-mono text-[12px] tracking-widest uppercase text-[#2F6FEF] mb-4 transition-all duration-600 ease-out px-4 py-1.5 rounded-full bg-black/5 border border-black/10 shadow-xs font-bold"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
                WebkitTextStroke: '0.4px currentColor',
              }}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>04 // LIVE TELEMETRY PIPELINE</span>
            </div>

            <h2
              className="text-[clamp(34px,4.2vw,54px)] font-black tracking-tight text-[#0B0F19] leading-tight mb-4 transition-all duration-600 ease-out"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? 'translateY(0)' : 'translateY(28px)',
                transitionDelay: '0.05s',
              }}
            >
              SUB-SECOND ON-DEVICE TRANSMISSION.
            </h2>

            <p
              className="text-[18px] text-[#4B5563] leading-[1.75] max-w-[440px] mb-8 transition-all duration-600 ease-out"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: '0.15s',
              }}
            >
              The reassembled dosimeter transmits quantitative gas metrics and shift exposure trendlines continuously over BLE 5.0 to worker handsets and facility monitoring gateways.
            </p>

            {/* Mobile App Mockup Frame (HTML) */}
            <div
              className="w-full max-w-[360px] rounded-[36px] bg-[#0B0B0B] p-3 shadow-2xl border-4 border-[#22252A] relative mb-4 transition-all duration-700 ease-out"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
                transitionDelay: '0.2s',
              }}
            >
              {/* Dynamic Island */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30" />

              {/* Screen Inner */}
              <div className="w-full rounded-[28px] bg-[#0F172A] text-white p-5 pt-8 overflow-hidden relative border border-white/10">
                {/* App Status Bar with Live State Transition */}
                <div className="flex items-center justify-between font-mono text-[11px] text-gray-400 pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div ref={phoneBleDotRef} className="relative flex items-center justify-center w-2.5 h-2.5">
                      <span
                        className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                          connectionStatus === 'active' ? 'bg-[#22C55E] animate-green-pulse' : 'bg-[#FBBF24] animate-ping'
                        }`}
                      />
                    </div>
                    <span className="font-bold text-white">
                      {connectionStatus === 'active' ? 'BLE LINK: ACTIVE' : 'ACQUIRING BEACON...'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">DOSIMETER #01</span>
                </div>

                {/* Primary Quantitative Gas Readout */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider font-bold">
                      MEASURED H2S
                    </span>
                    <span className="px-3.5 py-1 rounded-full font-mono text-[11px] font-bold tracking-wider bg-green-500/20 text-green-400 border border-green-500/30 shadow-xs">
                      SAFE // NORMAL
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-black font-mono tracking-tight text-white">
                      4.8
                    </span>
                    <span className="text-base font-mono text-gray-400 font-bold">PPM</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[12px] text-gray-400 mt-3 pt-2 border-t border-white/5">
                    <span>SHIFT TWA: 2.1 PPM</span>
                    <span>PEAK: 5.4 PPM</span>
                  </div>
                </div>

                {/* Simulated Shift Trendline SVG */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex items-center justify-between font-mono text-[11px] text-gray-400 mb-2">
                    <span className="font-bold">SHIFT EXPOSURE TREND</span>
                    <span className="text-[#2F6FEF] font-bold">LIVE</span>
                  </div>
                  <svg className="w-full h-14" viewBox="0 0 260 60">
                    <defs>
                      <linearGradient id="chart-glow-conn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2F6FEF" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#2F6FEF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,45 Q30,42 60,38 T120,40 T180,24 T230,30 L260,28 L260,60 L0,60 Z"
                      fill="url(#chart-glow-conn)"
                    />
                    <path
                      d="M0,45 Q30,42 60,38 T120,40 T180,24 T230,30 L260,28"
                      fill="none"
                      stroke="#2F6FEF"
                      strokeWidth="2.5"
                    />
                    <line x1="0" y1="18" x2="260" y2="18" stroke="#EAB308" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                  </svg>
                  <div className="flex justify-between font-mono text-[10px] text-gray-500 mt-1 font-medium">
                    <span>SHIFT START</span>
                    <span>MID SHIFT</span>
                    <span>CURRENT</span>
                  </div>
                </div>

                {/* AI-Assisted Calibration Card */}
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/25">
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="text-[#2F6FEF] font-bold">PRETRAINED ON-DEVICE MODEL</span>
                    <span className="text-green-400 font-bold">CONF: 96%</span>
                  </div>
                  <p className="text-[11.5px] text-gray-300 leading-snug mt-1">
                    AI-assisted calibration on a pretrained on-device model applying lightweight bias and scale correction from reference points.
                  </p>
                  <div className="flex items-center justify-between font-mono text-[10px] text-gray-400 mt-2 pt-1.5 border-t border-white/10">
                    <span>CORRECTION: BIAS / SCALE</span>
                    <span>TARGET: TFLITE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Facility Gateway Secondary Node Card */}
            <div
              className="w-full max-w-[360px] rounded-2xl bg-white/80 backdrop-blur-md p-4 border border-black/10 shadow-sm transition-all duration-700 ease-out"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
                transitionDelay: '0.25s',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2F6FEF] animate-pulse" />
                  <span className="font-mono text-[11px] font-bold tracking-wider text-[#0B0F19]">
                    FACILITY MESH GATEWAY // NODE 04
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#2F6FEF]/10 text-[#2F6FEF] border border-[#2F6FEF]/20">
                  SYNCHRONIZED
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-[#4B5563] pt-2 border-t border-black/5">
                <div>
                  <span className="text-[10px] text-[#9CA3AF] block">GATEWAY ID</span>
                  <span className="font-bold text-[#0B0F19]">GW-IND-8820</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] block">SIGNAL STRENGTH</span>
                  <span className="font-bold text-[#22C55E]">-62 dBm (EXCELLENT)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rebuilt BLE Connectivity Line: Full-width organic bezier arc connecting Watch ESP32 antenna to Phone BLE dot */}
          {bleCoords && (
            <svg className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none overflow-visible z-35">
              <defs>
                <filter id="ble-glow-conn" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#2F6FEF" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Endpoint Halo at Watch ESP32 Module */}
              <g transform={`translate(${bleCoords.wX}, ${bleCoords.wY})`}>
                <circle r="4" fill="#2F6FEF" />
                <circle r="8" fill="none" stroke="#2F6FEF" strokeWidth="1.5">
                  <animate attributeName="r" values="6;22;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r="14" fill="#2F6FEF" fillOpacity="0.12">
                  <animate attributeName="r" values="8;28;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Endpoint Halo at Phone BLE Active Dot */}
              <g transform={`translate(${bleCoords.pX}, ${bleCoords.pY})`}>
                <circle r="10" fill="none" stroke="#22C55E" strokeWidth="1.5">
                  <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Technical Bezier Base Curve from Watch to Phone */}
              {(() => {
                const dx = bleCoords.wX - bleCoords.pX
                const pathD = `M ${bleCoords.wX} ${bleCoords.wY} C ${bleCoords.wX - dx * 0.42} ${bleCoords.wY - 65}, ${bleCoords.pX + dx * 0.35} ${bleCoords.pY - 45}, ${bleCoords.pX} ${bleCoords.pY}`
                const midX = (bleCoords.wX + bleCoords.pX) / 2
                const midY = (bleCoords.wY + bleCoords.pY) / 2 - 55

                return (
                  <>
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#2F6FEF"
                      strokeWidth="1.5"
                      strokeOpacity="0.35"
                      strokeDasharray="4 4"
                    />

                    {/* 4 Traveling Pulse Dots: Watch -> Phone */}
                    <circle r="3.5" fill="#2F6FEF" opacity="0.85" filter="url(#ble-glow-conn)">
                      <animateMotion path={pathD} dur="1.4s" repeatCount="indefinite" begin="0s" />
                    </circle>
                    <circle r="3.5" fill="#2F6FEF" opacity="0.85" filter="url(#ble-glow-conn)">
                      <animateMotion path={pathD} dur="1.4s" repeatCount="indefinite" begin="0.35s" />
                    </circle>
                    <circle r="3.5" fill="#2F6FEF" opacity="0.85" filter="url(#ble-glow-conn)">
                      <animateMotion path={pathD} dur="1.4s" repeatCount="indefinite" begin="0.7s" />
                    </circle>
                    <circle r="3.5" fill="#2F6FEF" opacity="0.85" filter="url(#ble-glow-conn)">
                      <animateMotion path={pathD} dur="1.4s" repeatCount="indefinite" begin="1.05s" />
                    </circle>

                    {/* Midpoint Pill Label: BLE 5.0 // LIVE TELEMETRY */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-96"
                        y="-15"
                        width="192"
                        height="30"
                        rx="15"
                        fill="#0B0F19"
                        fillOpacity="0.92"
                        stroke="#2F6FEF"
                        strokeWidth="1.2"
                        strokeOpacity="0.5"
                      />
                      <text
                        textAnchor="middle"
                        dy="4.5"
                        fill="#2F6FEF"
                        fillOpacity="0.95"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="10"
                        fontWeight="600"
                        letterSpacing="0.08em"
                      >
                        BLE 5.0 // LIVE TELEMETRY
                      </text>
                    </g>
                  </>
                )
              })()}
            </svg>
          )}

          {/* ================= RIGHT COLUMN: Assembled 3D Watch Area ================= */}
          <div className="w-full lg:w-[44vw] min-h-[420px] lg:min-h-screen pointer-events-none" />
        </div>
      </div>
    </section>
  )
}

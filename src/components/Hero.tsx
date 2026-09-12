import { useEffect, useRef, useState, useMemo } from 'react'
import { gsap } from '../lib/gsap'
import { useStore } from '../state/store'

function ScrollInvite() {
  const explodeProgress = useStore((s) => s.explodeProgress)
  return (
    <div
      className="mt-auto transition-opacity duration-300 pt-4"
      style={{ opacity: explodeProgress > 0.08 ? 0 : 1 }}
    >
      <div className="inline-flex items-center gap-2 animate-scroll-invite">
        <span className="font-mono text-[9px] tracking-[0.15em] text-white/25 uppercase">
          ↓ EXPLORE SUBSYSTEM ARCHITECTURE
        </span>
      </div>
    </div>
  )
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const rad1 = (startAngle * Math.PI) / 180
  const rad2 = (endAngle * Math.PI) / 180
  // Going clockwise from bottom (0 deg = bottom)
  const x1 = cx - r * Math.sin(rad1)
  const y1 = cy + r * Math.cos(rad1)
  const x2 = cx - r * Math.sin(rad2)
  const y2 = cy + r * Math.cos(rad2)
  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${x1} ${y1} A ${r} ${r} 0 ${arcSweep} 0 ${x2} ${y2}`
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const setActiveSection = useStore((s) => s.setActiveSection)
  const [ticksDrawn, setTicksDrawn] = useState(false)

  // Refs for entrance animations
  const pillRef = useRef<HTMLDivElement>(null)
  const h1L1Ref = useRef<HTMLHeadingElement>(null)
  const h1L2Ref = useRef<HTMLHeadingElement>(null)
  const h1L3Ref = useRef<HTMLHeadingElement>(null)
  const h1L4Ref = useRef<HTMLHeadingElement>(null)
  const subheadRef = useRef<HTMLParagraphElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const arc1Ref = useRef<SVGPathElement>(null)
  const arc2Ref = useRef<SVGPathElement>(null)
  const arc3Ref = useRef<SVGPathElement>(null)
  const arc4Ref = useRef<SVGPathElement>(null)

  // Generate 72 outer ticks (every 5 deg from top, clockwise)
  const outerTicks = useMemo(() => {
    const ticks = []
    const cx = 340
    const cy = 340
    const rOuter = 290
    for (let i = 0; i < 72; i++) {
      const angle = i * 5
      const rad = (angle * Math.PI) / 180
      const isMajor = i % 6 === 0
      const length = isMajor ? 16 : 10
      const rInner = rOuter - length
      const x1 = cx + rInner * Math.sin(rad)
      const y1 = cy - rInner * Math.cos(rad)
      const x2 = cx + rOuter * Math.sin(rad)
      const y2 = cy - rOuter * Math.cos(rad)
      ticks.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        isMajor,
      })
    }
    return ticks
  }, [])

  // Generate 36 innermost detail ticks (every 10 deg)
  const innerTicks = useMemo(() => {
    const ticks = []
    const cx = 340
    const cy = 340
    const rOuter = 228
    const rInner = 224
    for (let i = 0; i < 36; i++) {
      const angle = i * 10
      const rad = (angle * Math.PI) / 180
      const x1 = cx + rInner * Math.sin(rad)
      const y1 = cy - rInner * Math.cos(rad)
      const x2 = cx + rOuter * Math.sin(rad)
      const y2 = cy - rOuter * Math.cos(rad)
      ticks.push({ id: i, x1, y1, x2, y2 })
    }
    return ticks
  }, [])

  useEffect(() => {
    // 1. Stagger animate outer ticks clockwise from top (0.02s stagger, 1.4s sweep)
    const tickElements = document.querySelectorAll('.hero-outer-tick')
    if (tickElements.length > 0) {
      gsap.fromTo(
        tickElements,
        { opacity: 0 },
        {
          opacity: 1,
          stagger: 0.02,
          duration: 0.08,
          ease: 'power1.inOut',
          onComplete: () => setTicksDrawn(true),
        }
      )
    }

    // 2. Animate Ring 2 arcs stroke-dashoffset draw-in over 1.6s
    const arcs = [arc1Ref.current, arc2Ref.current, arc3Ref.current, arc4Ref.current]
    arcs.forEach((arc) => {
      if (arc) {
        const len = arc.getTotalLength()
        gsap.set(arc, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(arc, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: 'power2.out',
          delay: 0.1,
        })
      }
    })

    // 3. Section 1C: Left Column Entrance Animations
    if (pillRef.current) {
      gsap.fromTo(
        pillRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
      )
    }
    const lines = [h1L1Ref.current, h1L2Ref.current, h1L3Ref.current, h1L4Ref.current]
    const lineDelays = [0.18, 0.25, 0.32, 0.39]
    lines.forEach((line, idx) => {
      if (line) {
        gsap.fromTo(
          line,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: lineDelays[idx] }
        )
      }
    })
    if (subheadRef.current) {
      gsap.fromTo(
        subheadRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.48 }
      )
    }
    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.56 }
      )
    }

    // 4. Section detection
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection('hero')
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [setActiveSection])

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full min-h-screen text-[#F5F5F3] flex items-center overflow-hidden select-none bg-transparent"
    >
      {/* Background Ghost Watermark */}
      <div className="absolute left-[-2vw] top-[18vh] text-[clamp(140px,22vw,320px)] font-black tracking-[-0.06em] text-white/[0.025] pointer-events-none select-none leading-none z-10">
        H2S
      </div>

      {/* Hero Layout: Left Column (0 to 42vw) + Right Column (44vw to 100vw) */}
      <div className="w-full min-h-screen flex flex-col lg:flex-row items-center justify-between relative z-30 px-6 sm:px-12 lg:px-0">
        
        {/* ================= LEFT COLUMN: Text Content (0 to 42vw) ================= */}
        <div className="w-full lg:w-[42vw] min-h-screen flex flex-col justify-center lg:pl-[80px] lg:pr-4 pt-28 pb-12 z-30">
          
          {/* ELEMENT 1: Section Pill */}
          <div
            ref={pillRef}
            className="inline-flex items-center self-start border border-white/15 rounded-full px-4 py-1.5 mb-[40px] bg-white/[0.04] backdrop-blur-md shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#22C55E] mr-2.5 shrink-0 animate-green-pulse" />
            <span className="font-mono text-[12px] tracking-[0.14em] text-white/70 uppercase font-semibold">
              SIH 2026 // INDUSTRIAL SAFETY DOSIMETRY
            </span>
          </div>

          {/* ELEMENT 2: Main Headline (H1) */}
          <div className="flex flex-col mb-[32px] tracking-[-0.02em]">
            <h1
              ref={h1L1Ref}
              className="text-[clamp(44px,5.4vw,76px)] font-black text-[#F5F5F3] leading-[0.92] m-0"
            >
              PASSIVE
            </h1>
            <h1
              ref={h1L2Ref}
              className="text-[clamp(44px,5.4vw,76px)] font-black text-[#F5F5F3] leading-[0.92] m-0"
            >
              COLORIMETRIC
            </h1>
            <h1
              ref={h1L3Ref}
              className="text-[clamp(44px,5.4vw,76px)] font-black text-[#2F6FEF] leading-[0.92] m-0"
            >
              H2S EXPOSURE
            </h1>
            <h1
              ref={h1L4Ref}
              className="text-[clamp(44px,5.4vw,76px)] font-black text-[#F5F5F3] leading-[0.92] m-0 text-stroke"
            >
              WRISTBAND
            </h1>
          </div>

          {/* ELEMENT 3: Subheadline */}
          <p
            ref={subheadRef}
            className="text-[17px] leading-[1.75] text-[#F5F5F3]/65 max-w-[420px] mb-[48px]"
          >
            Quantitative workplace gas dosimetry combining passive colorimetric sensing and{' '}
            <span className="text-[#F5F5F3]/90 font-semibold">
              AI-assisted calibration on a pretrained on-device model
            </span>.
          </p>

          {/* ELEMENT 4: Two Inline HUD Stat Rows */}
          <div ref={statsRef} className="w-full max-w-[400px] flex flex-col mb-12">
            {/* Row 1: Color Drift */}
            <div className="flex items-center justify-between py-2.5">
              <span className="font-mono text-[11.5px] tracking-wider text-white/40 uppercase">
                COLOR DRIFT ΔE
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-[#F5F5F3]">0.04</span>
                <span className="font-mono text-[11px] text-[#22C55E] tracking-wider font-bold">
                  NORMAL
                </span>
              </div>
            </div>

            {/* Separator Line */}
            <div className="w-full h-[1px] bg-white/[0.08]" />

            {/* Row 2: Inference Pipeline */}
            <div className="flex items-center justify-between py-2.5">
              <span className="font-mono text-[11.5px] tracking-wider text-white/40 uppercase">
                TFLITE ON-DEVICE
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-[#F5F5F3]">CONF: 96%</span>
                <span className="font-mono text-[11px] text-[#2F6FEF] tracking-wider font-bold">
                  BIAS-CORRECTED
                </span>
              </div>
            </div>
          </div>

          {/* ELEMENT 5: Scroll Invite */}
          <ScrollInvite />
        </div>

        {/* Center 2% Breathing Room (42vw to 44vw) */}
        <div className="hidden lg:block w-[2vw] pointer-events-none" />

        {/* ================= RIGHT COLUMN: Multi-Ring Visual (44vw to 100vw) ================= */}
        <div className="w-full lg:w-[56vw] min-h-[60vh] lg:min-h-screen flex items-center justify-center relative pointer-events-none z-0">
          
          {/* Multi-Ring SVG System (Diameter: 58vw, max 680px) */}
          <div className="w-[min(58vw,680px)] h-[min(58vw,680px)] relative flex items-center justify-center">
            
            {/* SVG Ring System */}
            <svg
              className="w-full h-full overflow-visible pointer-events-none"
              viewBox="0 0 680 680"
              fill="none"
            >
              {/* RING 3: Inner dark filled circle (radius 248px) */}
              <circle
                cx="340"
                cy="340"
                r="248"
                fill="rgba(0, 0, 0, 0.4)"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
              />

              {/* RING 4: Innermost detail ring (radius 228px, 0.5px stroke) */}
              <circle
                cx="340"
                cy="340"
                r="228"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="0.5"
              />
              {/* Ring 4 Inner 36 ticks */}
              {innerTicks.map((t) => (
                <line
                  key={`inner-${t.id}`}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
              ))}

              {/* RING 2: Segmented Danger/Safety Arc Ring (radius 268px, stroke 6px) */}
              <g style={{ filter: 'drop-shadow(0 0 8px rgba(47, 111, 239, 0.35))' }}>
                {/* Arc 1: Safe Zone (#22C55E, 0° to 120° from bottom) */}
                <path
                  ref={arc1Ref}
                  d={describeArc(340, 340, 268, 0.45, 119.55)}
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Arc 2: Caution Zone (#EAB308, 120° to 200°) */}
                <path
                  ref={arc2Ref}
                  d={describeArc(340, 340, 268, 120.45, 199.55)}
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Arc 3: Warning Zone (#F97316, 200° to 260°) */}
                <path
                  ref={arc3Ref}
                  d={describeArc(340, 340, 268, 200.45, 259.55)}
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Arc 4: Danger Zone (#E5484D, 260° to 360°) */}
                <path
                  ref={arc4Ref}
                  d={describeArc(340, 340, 268, 260.45, 359.55)}
                  fill="none"
                  stroke="#E5484D"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </g>

              {/* RING 2 Threshold Markers & Labels */}
              {/* Marker 1: 10 PPM (120° from bottom) */}
              {(() => {
                const rad = (120 * Math.PI) / 180
                const x1 = 340 - 268 * Math.sin(rad)
                const y1 = 340 + 268 * Math.cos(rad)
                const x2 = 340 - 282 * Math.sin(rad)
                const y2 = 340 + 282 * Math.cos(rad)
                const lx = 340 - 298 * Math.sin(rad)
                const ly = 340 + 298 * Math.cos(rad)
                return (
                  <g key="th-10">
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      x={lx}
                      y={ly + 4}
                      textAnchor="end"
                      fill="rgba(255, 255, 255, 0.6)"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="9"
                      letterSpacing="0.05em"
                    >
                      10 PPM (TWA)
                    </text>
                  </g>
                )
              })()}

              {/* Marker 2: 20 PPM (200° from bottom) */}
              {(() => {
                const rad = (200 * Math.PI) / 180
                const x1 = 340 - 268 * Math.sin(rad)
                const y1 = 340 + 268 * Math.cos(rad)
                const x2 = 340 - 282 * Math.sin(rad)
                const y2 = 340 + 282 * Math.cos(rad)
                const lx = 340 - 298 * Math.sin(rad)
                const ly = 340 + 298 * Math.cos(rad)
                return (
                  <g key="th-20">
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="start"
                      fill="rgba(255, 255, 255, 0.6)"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="9"
                      letterSpacing="0.05em"
                    >
                      20 PPM (STEL)
                    </text>
                  </g>
                )
              })()}

              {/* Marker 3: 50 PPM (260° from bottom) */}
              {(() => {
                const rad = (260 * Math.PI) / 180
                const x1 = 340 - 268 * Math.sin(rad)
                const y1 = 340 + 268 * Math.cos(rad)
                const x2 = 340 - 282 * Math.sin(rad)
                const y2 = 340 + 282 * Math.cos(rad)
                const lx = 340 - 298 * Math.sin(rad)
                const ly = 340 + 298 * Math.cos(rad)
                return (
                  <g key="th-50">
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E5484D" strokeWidth="2" />
                    <text
                      x={lx}
                      y={ly + 10}
                      textAnchor="start"
                      fill="#E5484D"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="9"
                      letterSpacing="0.05em"
                    >
                      50 PPM (DANGER)
                    </text>
                  </g>
                )
              })()}

              {/* RING 1: Outer 72-Tick Ring (radius 290px, breathing pulse only after mount) */}
              <g className={ticksDrawn ? 'animate-ring-breathe' : ''}>
                {outerTicks.map((t) => (
                  <line
                    key={`outer-${t.id}`}
                    className="hero-outer-tick"
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                    stroke={t.isMajor ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

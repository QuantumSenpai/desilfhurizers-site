import { useEffect, useRef } from 'react'
import { useStore } from '../state/store'
import { HARDWARE_PARTS, SHOWCASE_PARTS } from '../data/components'
import { scrollState, getHardwarePartScrollProgress } from '../hooks/useScrollExplode'
import { cameraTravelState } from '../three/cameraTravelState'
import { getLenis } from '../lib/lenis'
import { ScrollTrigger } from '../lib/gsap'

export interface ScreenAnchor {
  x: number
  y: number
}

// Global handle for direct 60fps updates from R3F useFrame
export const leaderLinesHandle = {
  update: null as ((anchors: Record<string, ScreenAnchor>) => void) | null,
}

export let lastScreenAnchors: Record<string, ScreenAnchor> = {}

// 2 Key Parts for WorkingPrinciple Lightweight Variant (camera-module removed in V12)
const LITE_PARTS = [
  {
    id: 'h2s-sensor',
    category: 'DETECTION',
    name: 'Colorimetric Substrate // Exposure Chamber',
    color: '#22C55E',
  },
  {
    id: 'esp32',
    category: 'PROCESSING',
    name: 'Dual-Core MCU // BLE 5.0 Telemetry',
    color: '#2F6FEF',
  },
]

export function LeaderLinesOverlay() {
  const focusIndex = useStore((s) => s.focusIndex)
  const setFocusIndex = useStore((s) => s.setFocusIndex)
  const activeSection = useStore((s) => s.activeSection)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPartId = useStore((s) => s.setSelectedPartId)

  // Direct DOM refs for 60fps zero-overhead updates
  const spotlightPolylineRef = useRef<SVGPolylineElement>(null)
  const spotlightHaloRef = useRef<SVGCircleElement>(null)
  const spotlightDotRef = useRef<SVGCircleElement>(null)
  const anchorDotsRef = useRef<Record<string, SVGCircleElement>>({})

  const liteCardsRef = useRef<Record<string, HTMLDivElement>>({})
  const litePolylinesRef = useRef<Record<string, SVGPolylineElement>>({})
  const liteDotsRef = useRef<Record<string, SVGCircleElement>>({})
  const liteTrunkRef = useRef<SVGLineElement>(null)
  const liteJunctionsRef = useRef<Record<string, SVGCircleElement>>({})
  const litePulseRef = useRef<Record<string, SVGCircleElement>>({})

  // Direct DOM mutation refs so card and leader line update frame-for-frame with the 3D part
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const cardInnerRef = useRef<HTMLDivElement>(null)
  const svgLayerRef = useRef<SVGSVGElement>(null)

  // Mode gating: Lite labels strictly active only during WorkingPrinciple section
  const isShowcaseMode = focusIndex >= 0 || activeSection === 'hardware'
  const isLiteMode = !isShowcaseMode && activeSection === 'principle'

  // Resolve active showcase part:
  // In Hardware section, strictly follow focusIndex to eliminate HUD/geometry desync!
  const currentShowcaseIndex =
    activeSection === 'hardware'
      ? Math.max(0, Math.min(5, Math.round(focusIndex < 0 ? 0 : focusIndex)))
      : selectedPartId !== null
      ? Math.max(0, SHOWCASE_PARTS.findIndex((p) => p.id === selectedPartId))
      : Math.max(0, Math.min(5, Math.round(focusIndex < 0 ? 0 : focusIndex)))

  const currentPart = SHOWCASE_PARTS[currentShowcaseIndex]

  useEffect(() => {
    leaderLinesHandle.update = (anchors: Record<string, ScreenAnchor>) => {
      lastScreenAnchors = anchors
      const vw = window.innerWidth
      const vh = window.innerHeight

      // ── GATED ON CAMERA TRAVEL ARRIVAL ──
      // Card content swap and leader-line draw-in key off camera arrival,
      // eliminating the sudden pop and syncing perfectly with the 3D part.
      const rawFocus = scrollState.focusIndex
      let cardOpacity = 0
      let cardTranslateX = -24

      if (rawFocus >= 0) {
        const isTraveling = cameraTravelState.isTraveling
        const t = cameraTravelState.travelProgress

        if (isTraveling) {
          // Continuous cross-fade during travel between parts matching explodeUtils
          if (t < 0.45) {
            // Easing out of previous part
            const prog = t / 0.45
            cardOpacity = Math.cos(prog * (Math.PI / 2))
            cardTranslateX = Math.round(-24 * prog)
          } else {
            // Easing into target part
            const prog = (t - 0.45) / 0.55
            cardOpacity = Math.sin(prog * (Math.PI / 2))
            cardTranslateX = Math.round(-24 * (1 - prog))
          }
        } else {
          // Stationary / arrived at this part: ALWAYS 100% visible
          cardOpacity = 1.0
          cardTranslateX = 0
        }
      } else {
        // rawFocus < 0: Reassembly (Phase C) or Overview (Phase A).
        // During Phase C reassembly, smoothly fade out the HUD card across explodeProgress 1.0 -> 0.50
        const p = scrollState.explodeProgress
        if (activeSection === 'hardware' && p > 0.10 && p < 1.0) {
          const reassembleFade = Math.max(0, Math.min(1, (p - 0.50) / 0.50))
          cardOpacity = reassembleFade * 0.75
          cardTranslateX = Math.round(-24 * (1 - reassembleFade))
        } else {
          cardOpacity = 0
          cardTranslateX = -24
        }
      }

      // Apply card opacity/transform directly to DOM — no React re-render
      if (cardContainerRef.current) {
        cardContainerRef.current.style.opacity = String(cardOpacity)
        cardContainerRef.current.style.transform = `translateY(-50%) translateX(${cardTranslateX}px)`
        cardContainerRef.current.style.pointerEvents = cardOpacity > 0.05 ? 'auto' : 'none'
      }
      if (svgLayerRef.current) {
        svgLayerRef.current.style.opacity = String(cardOpacity)
      }

      // ── SPOTLIGHT LEADER LINE & HALO ──
      const activeAnchor = anchors[currentPart.id]
      if (activeAnchor) {
        const hudCardRightEdge = vw >= 1024 ? 80 + 360 : 24 + 320
        const startX = Math.min(hudCardRightEdge, Math.round(vw * 0.40))
        const startY = Math.round(vh * 0.50)
        const endX = Math.round(activeAnchor.x)
        const endY = Math.round(activeAnchor.y)
        const elbowX = Math.round((startX + endX) / 2)

        if (spotlightPolylineRef.current) {
          spotlightPolylineRef.current.setAttribute(
            'points',
            `${startX},${startY} ${elbowX},${startY} ${elbowX},${endY} ${endX},${endY}`
          )
        }
        if (spotlightHaloRef.current) {
          spotlightHaloRef.current.setAttribute('cx', String(endX))
          spotlightHaloRef.current.setAttribute('cy', String(endY))
        }
        if (spotlightDotRef.current) {
          spotlightDotRef.current.setAttribute('cx', String(endX))
          spotlightDotRef.current.setAttribute('cy', String(endY))
        }
      }

      // Subtle anchor dots for all 9 parts in 3D space
      HARDWARE_PARTS.forEach((p) => {
        const dot = anchorDotsRef.current[p.id]
        const a = anchors[p.id]
        if (dot && a) {
          dot.setAttribute('cx', String(Math.round(a.x)))
          dot.setAttribute('cy', String(Math.round(a.y)))
        }
      })

      // ── SECTION 2: WorkingPrinciple Responsive Clamped Labels with Dynamic Height & 76px Collision Resolution ──
      const activePrincipleStep = scrollState.principleStep ?? 0
      const cardW = 260
      const MIN_GAP_Y = 76

      interface LiteItemCalc {
        part: typeof LITE_PARTS[number]
        ax: number
        ay: number
        canFitRight: boolean
        cardX: number
        cardY: number
        realHeight: number
        lineTargetX: number
        lineTargetY: number
      }

      const liteItems: LiteItemCalc[] = []
      LITE_PARTS.forEach((p) => {
        const a = anchors[p.id]
        if (!a) return
        const ax = Math.round(a.x)
        const ay = Math.round(a.y)

        // Read real rendered height dynamically from DOM element to avoid assumptions on line-wrapping
        const cardEl = liteCardsRef.current[p.id]
        const realHeight = cardEl ? (cardEl.offsetHeight || 68) : 68

        // Horizontal flip check: does it fit on the right without bleeding past viewport?
        const canFitRight = ax + 50 + cardW <= vw - 24
        const rawCardX = canFitRight ? ax + 60 : ax - 60 - cardW
        const cardX = Math.max(16, Math.min(vw - cardW - 16, rawCardX))
        const lineTargetX = canFitRight ? cardX : cardX + cardW

        liteItems.push({
          part: p,
          ax,
          ay,
          canFitRight,
          cardX,
          cardY: Math.round(ay - realHeight / 2),
          realHeight,
          lineTargetX,
          lineTargetY: ay,
        })
      })

      // Sort by initial desired vertical position
      liteItems.sort((itemA, itemB) => itemA.cardY - itemB.cardY)

      // 1D Relaxation: Enforce >= 76px clearance between bottom of previous card and top of next card
      for (let i = 1; i < liteItems.length; i++) {
        const prevBottom = liteItems[i - 1].cardY + liteItems[i - 1].realHeight
        if (liteItems[i].cardY < prevBottom + MIN_GAP_Y) {
          liteItems[i].cardY = prevBottom + MIN_GAP_Y
        }
      }

      // Check bottom viewport boundary
      if (liteItems.length > 0) {
        const lastItem = liteItems[liteItems.length - 1]
        const maxY = vh - lastItem.realHeight - 24
        if (lastItem.cardY > maxY) {
          const overflow = lastItem.cardY - maxY
          for (let i = 0; i < liteItems.length; i++) {
            liteItems[i].cardY -= overflow
          }
        }
      }

      // Check top viewport boundary
      const minY = 80
      if (liteItems.length > 0 && liteItems[0].cardY < minY) {
        const underflow = minY - liteItems[0].cardY
        for (let i = 0; i < liteItems.length; i++) {
          liteItems[i].cardY += underflow
        }
      }

      // Re-center line target Y based on final relaxed card Y
      liteItems.forEach((item) => {
        item.lineTargetY = Math.round(item.cardY + item.realHeight / 2)
      })

      // ── CIRCUIT BUS TRUNK CALCULATION ──
      // Calculate intermediate vertical trunk bus X
      if (liteItems.length > 0) {
        const canFitRight = liteItems[0].canFitRight
        const allAnchorsX = liteItems.map((i) => i.ax)
        const trunkX = canFitRight
          ? Math.round(Math.max(...allAnchorsX) + 36)
          : Math.round(Math.min(...allAnchorsX) - 36)

        const allY = liteItems.flatMap((i) => [i.ay, i.lineTargetY])
        const trunkMinY = Math.min(...allY)
        const trunkMaxY = Math.max(...allY)

        if (liteTrunkRef.current) {
          liteTrunkRef.current.setAttribute('x1', String(trunkX))
          liteTrunkRef.current.setAttribute('y1', String(trunkMinY))
          liteTrunkRef.current.setAttribute('x2', String(trunkX))
          liteTrunkRef.current.setAttribute('y2', String(trunkMaxY))
        }

        // Apply circuit bus paths, nodes, and card positions to DOM
        liteItems.forEach((item) => {
          const card = liteCardsRef.current[item.part.id]
          const polyline = litePolylinesRef.current[item.part.id]
          const dot = liteDotsRef.current[item.part.id]
          const junc = liteJunctionsRef.current[item.part.id]
          const pulse = litePulseRef.current[item.part.id]

          const isStepActive =
            (activePrincipleStep === 0 && item.part.id === 'h2s-sensor') ||
            (activePrincipleStep === 1 && item.part.id === 'esp32') ||
            activePrincipleStep === 2

          if (card) {
            card.style.transform = `translate3d(${item.cardX}px, ${item.cardY}px, 0) scale(${isStepActive ? 1.02 : 0.98})`
            card.style.opacity = isStepActive ? '1.0' : '0.50'
            card.style.zIndex = isStepActive ? '10' : '2'
          }

          // Orthogonal circuit bus path: Anchor -> Trunk -> Card Target
          if (polyline) {
            polyline.setAttribute(
              'points',
              `${item.ax},${item.ay} ${trunkX},${item.ay} ${trunkX},${item.lineTargetY} ${item.lineTargetX},${item.lineTargetY}`
            )
            polyline.setAttribute('stroke-opacity', isStepActive ? '0.90' : '0.25')
            polyline.setAttribute('stroke-width', isStepActive ? '2' : '1.2')
          }

          // Anchor dot at 3D part
          if (dot) {
            dot.setAttribute('cx', String(item.ax))
            dot.setAttribute('cy', String(item.ay))
            dot.setAttribute('opacity', isStepActive ? '1.0' : '0.45')
          }

          // Junction node where tap meets trunk
          if (junc) {
            junc.setAttribute('cx', String(trunkX))
            junc.setAttribute('cy', String(item.ay))
            junc.setAttribute('opacity', isStepActive ? '0.9' : '0.35')
          }

          // Pulse dot at card entry point
          if (pulse) {
            pulse.setAttribute('cx', String(item.lineTargetX))
            pulse.setAttribute('cy', String(item.lineTargetY))
            pulse.setAttribute('opacity', isStepActive ? '1.0' : '0')
          }
        })
      }
    }

    return () => {
      leaderLinesHandle.update = null
    }
  }, [currentPart, currentShowcaseIndex, focusIndex, activeSection])

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* ================= SECTION 3: SHOWCASE SPOTLIGHT HUD ================= */}
      <div
        className="absolute inset-0"
        style={{
          opacity: focusIndex >= 0 ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        {/* SVG Layer: Spotlight connecting polyline & pulsating anchor halo */}
        <svg
          ref={svgLayerRef}
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ opacity: 0 }}
        >
          {/* Focused Part Pulsing Halo */}
          <circle
            ref={spotlightHaloRef}
            r="12"
            fill="none"
            stroke={currentPart.color}
            strokeWidth="1.5"
            opacity="0.8"
          >
            <animate attributeName="r" values="8;22;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Focused Part Core Dot */}
          <circle
            ref={spotlightDotRef}
            r="4.5"
            fill={currentPart.color}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />

          {/* Leader Line connecting HUD card to Focused 3D Anchor */}
          <polyline
            ref={spotlightPolylineRef}
            fill="none"
            stroke={currentPart.color}
            strokeWidth="1.5"
            strokeOpacity="0.8"
            strokeDasharray="4 3"
          />
        </svg>

        {/* Docked Spotlight HUD Card on Left */}
        <div
          ref={cardContainerRef}
          className="absolute left-6 sm:left-12 lg:left-[80px] w-[320px] sm:w-[380px] max-w-[calc(100vw-48px)]"
          style={{ top: '50%', transform: 'translateY(-50%)', opacity: 0, pointerEvents: 'none' }}
        >
          <div
            ref={cardInnerRef}
            className="p-5 sm:p-7 rounded-2xl bg-white/95 backdrop-blur-xl border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.09)]"
          >
            {/* Header: Step Index & Category Pill */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[12.5px] font-bold tracking-widest text-gray-400">
                0{currentShowcaseIndex + 1} // 06
              </span>
              <span
                className="px-4 py-1.5 rounded-full font-mono text-[12px] font-bold uppercase tracking-wider border shadow-xs"
                style={{
                  color: currentPart.color,
                  backgroundColor: `${currentPart.color}15`,
                  borderColor: `${currentPart.color}40`,
                  WebkitTextStroke: '0.4px currentColor',
                }}
              >
                {currentPart.category}
              </span>
            </div>

            {/* Part Name */}
            <h3 className="text-2xl sm:text-3xl font-black text-[#0B0F19] tracking-tight leading-snug mb-4">
              {currentPart.name}
            </h3>

            {/* WHY / HOW two-line body copy — scaled up to 15px leading-[1.6] */}
            <div className="space-y-3 mb-5">
              <div className="flex gap-2.5">
                <span className="font-mono text-[11.5px] font-bold text-[#2F6FEF] tracking-widest uppercase w-10 shrink-0 pt-[2px]">WHY</span>
                <p className="text-[15px] text-[#374151] leading-[1.6]">{currentPart.why}</p>
              </div>
              <div className="flex gap-2.5">
                <span className="font-mono text-[11.5px] font-bold text-[#6B7280] tracking-widest uppercase w-10 shrink-0 pt-[2px]">HOW</span>
                <p className="text-[15px] text-[#4B5563] leading-[1.6]">{currentPart.how}</p>
              </div>
            </div>

            {/* Live Telemetry Status Readout Box */}
            <div className="p-4 rounded-xl bg-[#0B132B] text-white border border-white/10">
              <div className="flex items-center justify-between mb-1.5 font-mono text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span>ON-DEVICE TELEMETRY</span>
                </div>
                <span className="text-[#2F6FEF] font-bold">LIVE</span>
              </div>
              <div className="font-mono text-[13.5px] font-bold tracking-wide text-emerald-400">
                {currentPart.telemetryStatus}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FIXED BOTTOM-CENTER INSPECTION SEQUENCE HUD BAR ================= */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out flex flex-col items-center gap-2 pointer-events-auto select-none"
        style={{
          opacity: focusIndex >= 0 && focusIndex <= 5 ? 1 : 0,
          transform:
            focusIndex >= 0 && focusIndex <= 5
              ? 'translate(-50%, 0)'
              : 'translate(-50%, 24px)',
          pointerEvents: focusIndex >= 0 && focusIndex <= 5 ? 'auto' : 'none',
        }}
      >
        <div className="font-mono text-[10.5px] font-bold tracking-widest uppercase text-gray-500 bg-white/90 px-4 py-1 rounded-full backdrop-blur-md border border-black/10 shadow-xs">
          03 // SUBSYSTEM INSPECTION • {currentShowcaseIndex + 1} OF 6
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#0B0F19]/90 backdrop-blur-md border border-white/15 shadow-2xl">
          {SHOWCASE_PARTS.map((p, i) => {
            const isActive = i === currentShowcaseIndex
            return (
              <button
                key={`bar-${p.id}`}
                onClick={() => {
                  setFocusIndex(i)
                  setSelectedPartId(null)
                  scrollState.focusIndex = i

                  // Scroll smoothly to exact Hardware scroll window for this part
                  const progress = getHardwarePartScrollProgress(i)
                  const hwTrigger = ScrollTrigger.getById('hardware-trigger')
                  if (hwTrigger) {
                    const targetY = hwTrigger.start + progress * (hwTrigger.end - hwTrigger.start)
                    const lenis = getLenis()
                    if (lenis) {
                      lenis.scrollTo(targetY, { duration: 0.8 })
                    } else {
                      window.scrollTo({ top: targetY, behavior: 'smooth' })
                    }
                  }
                }}
                className={`h-7 px-3 rounded-full flex items-center justify-center font-mono text-[12px] font-bold transition-all ${
                  isActive
                    ? 'text-white shadow-md scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                style={{
                  backgroundColor: isActive ? p.color : 'transparent',
                }}
                title={p.name}
              >
                0{i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* ================= SECTION 2: WORKING PRINCIPLE LITE LABELS ================= */}
      <div
        className="transition-opacity duration-500 ease-out"
        style={{
          opacity: isLiteMode ? 1 : 0,
          pointerEvents: isLiteMode ? 'auto' : 'none',
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          {/* Shared Central Vertical Circuit Bus Trunk */}
          <line
            ref={liteTrunkRef}
            stroke="#2F6FEF"
            strokeWidth="1.5"
            strokeOpacity="0.35"
            strokeDasharray="2 2"
          />

          {LITE_PARTS.map((p) => (
            <g key={`lite-svg-${p.id}`}>
              {/* 3D Part Anchor Dot */}
              <circle
                ref={(el) => {
                  if (el) liteDotsRef.current[p.id] = el
                }}
                r="3.5"
                fill={p.color}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              {/* Bus Branch Routing Polyline */}
              <polyline
                ref={(el) => {
                  if (el) litePolylinesRef.current[p.id] = el
                }}
                fill="none"
                stroke={p.color}
                strokeWidth="1.5"
                strokeOpacity="0.6"
                strokeDasharray="3 3"
              />
              {/* Bus Junction Node */}
              <circle
                ref={(el) => {
                  if (el) liteJunctionsRef.current[p.id] = el
                }}
                r="2.5"
                fill={p.color}
                opacity="0.6"
              />
              {/* Active Step Pulse Indicator Dot */}
              <circle
                ref={(el) => {
                  if (el) litePulseRef.current[p.id] = el
                }}
                r="4.5"
                fill={p.color}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                opacity="0"
              >
                <animate attributeName="r" values="3.5;6;3.5" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.35;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        </svg>

        {LITE_PARTS.map((p) => (
          <div
            key={`lite-card-${p.id}`}
            ref={(el) => {
              if (el) liteCardsRef.current[p.id] = el
            }}
            className="absolute top-0 left-0 select-none rounded-[12px] px-3.5 py-2.5 bg-white/95 backdrop-blur-md border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] w-[260px] transition-all duration-300"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span
                className="font-mono text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: p.color }}
              >
                {p.category}
              </span>
            </div>
            <div className="text-[13px] font-bold text-[#0B0F19] leading-snug break-words">
              {p.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

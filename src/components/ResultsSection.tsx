import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { BarChart3, Award, Clock, Activity } from 'lucide-react'

export function ResultsSection() {
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
            setActiveSection('results')
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
      id="results"
      ref={sectionRef}
      className="relative w-full min-h-screen text-[#0B0F19] flex flex-col justify-center px-6 sm:px-12 lg:px-[80px] py-28 select-none bg-transparent z-50"
    >
      <div className="w-full relative z-30">
        {/* Section Header */}
        <div
          className="section-text-col flex flex-col items-start mb-14 transition-all duration-700 ease-out"
          style={{
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/10 text-[#2F6FEF] font-mono text-[12px] font-bold tracking-widest uppercase mb-4 shadow-xs">
            <BarChart3 className="w-4 h-4" />
            <span>05 // VALIDATION & BENCHMARKS</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0B0F19] leading-tight mb-4">
            VALIDATION BENCHMARKS.
          </h2>
          <p className="text-lg text-[#4B5563] leading-relaxed max-w-2xl">
            Quantitative laboratory calibration comparisons evaluate colorimetric optical shift data against standard
            reference detection instruments.
          </p>
        </div>

        {/* Results Cards Grid — clear placeholders for hackathon team */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Calibration Accuracy */}
          <div className="p-7 rounded-[12px] bg-white border border-black/[0.08] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#2F6FEF] mb-5">
                <Award className="w-5 h-5" />
              </div>
              <div className="font-mono text-[11.5px] font-bold text-[#6B7280] uppercase tracking-wider">
                CALIBRATION ACCURACY
              </div>
              {/* TODO: team to fill final copy/numbers */}
              <div className="text-4xl sm:text-5xl font-black font-mono text-[#0B0F19] my-3">
                [--.- %]
              </div>
              <p className="text-[13.5px] sm:text-sm text-[#4B5563] leading-relaxed">
                {/* TODO: team to fill final copy/numbers */}
                Quantitative measurement correlation against standard reference gas detection benchmarks.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.06] font-mono text-[12px] text-[#6B7280]/80">
              TARGET: HIGH CORRELATION
            </div>
          </div>

          {/* Card 2: Latency to Alarm */}
          <div className="p-7 rounded-[12px] bg-white border border-black/[0.08] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#EAB308] mb-5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="font-mono text-[11.5px] font-bold text-[#6B7280] uppercase tracking-wider">
                RESPONSE LATENCY
              </div>
              {/* TODO: team to fill final copy/numbers */}
              <div className="text-4xl sm:text-5xl font-black font-mono text-[#0B0F19] my-3">
                [&lt; -- SEC]
              </div>
              <p className="text-[13.5px] sm:text-sm text-[#4B5563] leading-relaxed">
                {/* TODO: team to fill final copy/numbers */}
                Time from optical drift detection to local acoustic buzzer and high-visibility LED trigger.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.06] font-mono text-[12px] text-[#6B7280]/80">
              TARGET: IMMEDIATE ALARM
            </div>
          </div>

          {/* Card 3: Shift Operational Endurance */}
          <div className="p-7 rounded-[12px] bg-white border border-black/[0.08] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[#22C55E] mb-5">
                <Activity className="w-5 h-5" />
              </div>
              <div className="font-mono text-[11.5px] font-bold text-[#6B7280] uppercase tracking-wider">
                SHIFT ENDURANCE
              </div>
              {/* TODO: team to fill final copy/numbers */}
              <div className="text-4xl sm:text-5xl font-black font-mono text-[#0B0F19] my-3">
                [-- HOURS]
              </div>
              <p className="text-[13.5px] sm:text-sm text-[#4B5563] leading-relaxed">
                {/* TODO: team to fill final copy/numbers */}
                Continuous operational autonomy with periodic camera capture and BLE beaconing on single charge.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.06] font-mono text-[12px] text-[#6B7280]/80">
              TARGET: FULL-SHIFT DEPLOYMENT
            </div>
          </div>
        </div>

        {/* Detailed Impact Summary Banner */}
        <div className="p-8 sm:p-10 rounded-[14px] bg-white border border-black/[0.08] shadow-sm">
          <div className="max-w-3xl">
            <span className="font-mono text-[12px] font-bold uppercase tracking-widest text-[#2F6FEF]">
              PROJECT SUMMARY STATEMENT
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0B0F19] mt-2 mb-3">
              Deployable Industrial Safety Through AI-Assisted Calibration on a Pretrained On-Device Model.
            </h3>
            <p className="text-base text-[#4B5563] leading-relaxed">
              {/* TODO: team to fill final copy/numbers */}
              By integrating passive colorimetric sensing, miniature optical camera capture, and on-device TFLite inference
              with AI-assisted calibration on a pretrained on-device model, Team DESILFHURIZERS delivers a compact, continuous,
              zero-encumbrance exposure dosimeter for industrial workforces.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

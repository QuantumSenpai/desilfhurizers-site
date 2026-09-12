import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { ScrollTrigger } from '../lib/gsap'
import { scrollState } from '../hooks/useScrollExplode'
import { Radio } from 'lucide-react'

export function WorkingPrinciple() {
  const sectionRef = useRef<HTMLElement>(null)
  const setActiveSection = useStore((s) => s.setActiveSection)
  const [hasEntered, setHasEntered] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection('principle')
            setHasEntered(true)
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.observe(el)

    // Scroll-driven 4-step sequence synchronized with 3D camera and category rim lights
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 65%',
      end: 'bottom top',
      onUpdate: (self) => {
        const step = Math.min(2, Math.max(0, Math.floor(self.progress * 3)))
        scrollState.principleStep = step
        setActiveStep(step)
      },
    })

    return () => {
      observer.disconnect()
      trigger.kill()
    }
  }, [setActiveSection])

  const pipelineSteps = [
    {
      step: '01',
      title: 'Colorimetric Sensing',
      category: 'DETECTION',
      color: '#22C55E',
      desc: 'Passive chemical reagent matrix undergoes optical reflectance shifts upon hazardous H2S gas exposure.',
    },
    {
      step: '02',
      title: 'Signal Processing',
      category: 'PROCESSING',
      color: '#2F6FEF',
      desc: 'ESP32-S3 extracts LAB color space deltas, chromaticity coordinates, and rate-of-change drift vectors.',
    },
    {
      step: '03',
      title: 'AI Calibration',
      category: 'INFERENCE',
      color: '#2F6FEF',
      desc: 'Pretrained on-device model infers parts-per-million with live bias and ambient drift correction.',
    },
  ]

  return (
    <section
      id="principle"
      ref={sectionRef}
      className="relative w-full min-h-screen text-[#0B0F19] flex flex-col justify-center select-none overflow-hidden bg-transparent py-24"
    >
      <div className="w-full relative z-30 px-6 sm:px-12 lg:px-0">
        {/* Main Row: Left Column (Text & 3 Pipeline Cards) and Right Column (3D Model Area) */}
        <div className="flex flex-col lg:flex-row items-center justify-between relative">
          {/* ================= LEFT COLUMN: Text & 3-Step Pipeline ================= */}
          <div className="w-full lg:w-[46vw] flex flex-col items-start lg:pl-[80px] lg:pr-6 z-30">
            {/* Section Header Badge with stroke polish */}
            <div
              className="inline-flex items-center gap-2 self-start font-mono text-[12px] tracking-widest uppercase text-[#2F6FEF] mb-3 transition-all duration-600 ease-out px-4 py-1.5 rounded-full bg-black/5 border border-black/10 shadow-xs font-bold"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
                transitionDelay: '0s',
                WebkitTextStroke: '0.4px currentColor',
              }}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>02 // INFERENCE PIPELINE</span>
            </div>

            <h2
              className="text-[clamp(34px,4.2vw,54px)] font-black tracking-tight text-[#0B0F19] leading-tight mb-4 transition-all duration-600 ease-out"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? 'translateY(0)' : 'translateY(28px)',
                transitionDelay: '0.05s',
              }}
            >
              COLORIMETRIC SENSING → QUANTITATIVE PPM.
            </h2>

            <p
              className="text-[18px] text-[#4B5563] leading-[1.75] max-w-[540px] mb-8 transition-all duration-600 ease-out"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: '0.12s',
              }}
            >
              Passive chemical reagents alter optical reflectance as hazardous H2S gas reacts. Onboard signal processing feeds a pretrained model with real-time calibration correction.
            </p>

            {/* 3 Pipeline Step Cards in single column */}
            <div className="grid grid-cols-1 gap-4 w-full max-w-[560px]">
              {pipelineSteps.map((item, i) => {
                const isActive = i === activeStep
                return (
                  <div
                    key={i}
                    className={`border rounded-[14px] p-5.5 transition-all duration-400 ease-out group ${
                      isActive
                        ? 'bg-white border-[#2F6FEF] shadow-md ring-2 ring-[#2F6FEF]/20 translate-y-[-2px]'
                        : 'bg-white/80 border-black/[0.08] shadow-sm hover:border-[#2F6FEF]/40'
                    }`}
                    style={{
                      opacity: hasEntered ? 1 : 0,
                      transform: hasEntered ? (isActive ? 'translateY(-2px)' : 'translateY(0)') : 'translateY(20px)',
                      transitionDelay: `${0.18 + i * 0.08}s`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span
                        className="font-mono text-[12px] font-bold tracking-wider"
                        style={{ color: item.color, WebkitTextStroke: '0.3px currentColor' }}
                      >
                        STEP {item.step} // {item.category}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isActive ? 'scale-125' : 'opacity-40'
                        }`}
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <h3 className="text-[18px] font-black text-[#0B0F19] mb-2 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[15.5px] text-[#4B5563] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: 3D Model Area ================= */}
          <div className="w-full lg:w-[46vw] min-h-[420px] lg:min-h-screen pointer-events-none" />
        </div>
      </div>
    </section>
  )
}

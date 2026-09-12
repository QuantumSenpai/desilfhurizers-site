import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { useStore } from '../state/store'

const TOTAL_TICKS = 24

export function ProgressTickBar() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const activeSection = useStore((s) => s.activeSection)

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setScrollProgress(Math.min(1, Math.max(0, window.scrollY / docHeight)))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    const trigger = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setScrollProgress(self.progress)
      },
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      trigger.kill()
    }
  }, [])

  const activeIndex = Math.min(
    TOTAL_TICKS - 1,
    Math.max(0, Math.floor(scrollProgress * TOTAL_TICKS))
  )

  const sectionLabelMap: Record<string, string> = {
    hero: '01 // OVERVIEW',
    design: '02 // ERGONOMICS',
    principle: '03 // INFERENCE',
    hardware: '04 // HARDWARE',
    explode: '04 // HARDWARE',
    connectivity: '05 // TELEMETRY',
    results: '06 // BENCHMARK',
  }

  const currentLabel = sectionLabelMap[activeSection] || '01 // OVERVIEW'
  const isDark = activeSection === 'hero'

  return (
    <aside
      aria-label="Page scroll progress"
      className="fixed bottom-6 right-8 z-[200] flex flex-col items-end gap-2 pointer-events-none select-none transition-colors duration-500"
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-mono tracking-widest uppercase transition-colors duration-500 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {currentLabel}
        </span>
        <span
          className={`text-[10px] font-mono font-bold transition-colors duration-500 ${
            isDark ? 'text-white' : 'text-[#0B0B0B]'
          }`}
        >
          {Math.round(scrollProgress * 100)}%
        </span>
      </div>

      {/* Row of thin vertical tick marks */}
      <div
        className={`flex items-end gap-[3px] p-1.5 rounded-md backdrop-blur-md border transition-all duration-500 ${
          isDark
            ? 'bg-black/40 border-white/10'
            : 'bg-white/80 border-black/10 shadow-sm'
        }`}
      >
        {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
          const isActive = i === activeIndex
          const isPassed = i < activeIndex
          const distance = Math.abs(i - activeIndex)

          let height = 12
          if (isActive) height = 22
          else if (distance === 1) height = 16
          else if (distance === 2) height = 14

          let tickColor = isDark ? '#333A48' : '#CBD5E1'
          if (isActive) {
            tickColor = '#2F6FEF'
          } else if (isPassed) {
            tickColor = isDark ? '#64748B' : '#94A3B8'
          }

          return (
            <span
              key={i}
              style={{
                height: `${height}px`,
                backgroundColor: tickColor,
                width: isActive ? '3px' : '2px',
              }}
              className="rounded-full transition-all duration-200"
            />
          )
        })}
      </div>
    </aside>
  )
}

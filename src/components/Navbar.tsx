import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { useStore } from '../state/store'
import { getLenis } from '../lib/lenis'

export function Navbar() {
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false)
  const activeSection = useStore((s) => s.activeSection)

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 'top -80px',
      onUpdate: (self) => {
        setIsScrolledPastHero(self.scroll() > window.innerHeight * 0.75)
      },
    })

    return () => {
      trigger.kill()
    }
  }, [])

  const navLinks = [
    { href: '#design', sectionId: 'design', label: '01 ERGONOMICS' },
    { href: '#principle', sectionId: 'principle', label: '02 PRINCIPLE' },
    { href: '#hardware', sectionId: 'hardware', label: '03 HARDWARE' },
    { href: '#connectivity', sectionId: 'connectivity', label: '04 TELEMETRY' },
    { href: '#results', sectionId: 'results', label: '05 BENCHMARK' },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const id = href.replace('#', '')
    if (id === 'hero') {
      const lenis = getLenis()
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      window.history.pushState(null, '', href)
      return
    }

    const el = document.getElementById(id)
    if (!el) return

    // Find if this target has a pinned ScrollTrigger (e.g. #hardware)
    const allTriggers = ScrollTrigger.getAll()
    const pinTrigger = allTriggers.find(
      (t) =>
        t.vars.pin &&
        (t.trigger === el || (typeof t.vars.trigger === 'string' && t.vars.trigger.includes(id)))
    )

    let targetY = 0
    if (pinTrigger) {
      targetY = pinTrigger.start
    } else {
      targetY = el.getBoundingClientRect().top + window.scrollY
    }

    const lenis = getLenis()
    if (lenis) {
      lenis.scrollTo(targetY, { duration: 1.2 })
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }
    window.history.pushState(null, '', href)
  }

  return (
    <header
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-400 ease-out ${
        isScrolledPastHero
          ? 'bg-[#F7F6F3]/[0.92] backdrop-blur-[16px] text-[#0B0F19] border-b border-black/[0.08] shadow-sm py-3.5'
          : 'bg-transparent text-[#F5F5F3] border-b border-transparent py-5'
      }`}
    >
      <div className="w-full px-6 sm:px-12 lg:px-[80px] flex items-center justify-between">
        
        {/* Left: Brand + Logo Icon */}
        <a href="#hero" onClick={(e) => handleNavClick(e, '#hero')} className="flex items-center gap-3 group">
          <div className="w-[18px] h-[18px] text-[#2F6FEF] flex items-center justify-center shrink-0">
            {/* Minimal Hex/Waveform SVG Logo */}
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2L2 7L2 17L12 22L22 17L22 7L12 2Z" strokeLinejoin="round" />
              <polyline points="7 12 10 9 14 15 17 12" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span
              className={`font-mono text-[13px] font-bold tracking-widest uppercase transition-colors duration-300 ${
                isScrolledPastHero ? 'text-[#0B0F19]' : 'text-[#F5F5F3]'
              }`}
            >
              DESULPHERISERS
            </span>
            <span
              className={`font-mono text-[9px] tracking-wider transition-colors duration-300 ${
                isScrolledPastHero ? 'text-[#0B0F19]/50' : 'text-[#F5F5F3]/50'
              }`}
            >
              DOSIMETER-01 // SIH 2026
            </span>
          </div>
        </a>

        {/* Center: Minimal Anchor Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive =
              activeSection === link.sectionId ||
              (link.sectionId === 'hardware' && activeSection === 'explode')
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`font-mono text-[11px] tracking-[0.08em] relative py-1 transition-colors duration-200 ${
                  isActive
                    ? isScrolledPastHero
                      ? 'text-[#0B0F19] font-medium'
                      : 'text-[#F5F5F3] font-medium'
                    : isScrolledPastHero
                    ? 'text-[#0B0F19]/50 hover:text-[#0B0F19]'
                    : 'text-[#F5F5F3]/50 hover:text-[#F5F5F3]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#2F6FEF] rounded-full" />
                )}
              </a>
            )
          })}
        </nav>

        {/* Right: BLE Status Pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-colors duration-300 shadow-xs ${
            isScrolledPastHero
              ? 'bg-black/5 border-black/10 text-[#0B0F19]'
              : 'bg-white/10 border-white/15 text-[#F5F5F3] backdrop-blur-md'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-green-pulse shrink-0" />
          <span className="font-mono text-[10px] font-semibold tracking-wider">
            SYS ACTIVE // BLE
          </span>
        </div>
      </div>
    </header>
  )
}

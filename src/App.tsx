import { lazy, Suspense } from 'react'
import { useLenis } from './lib/lenis'
import { useScrollExplode } from './hooks/useScrollExplode'
import { useStore } from './state/store'
import { Navbar } from './components/Navbar'
import { ProgressTickBar } from './components/ProgressTickBar'
import { DebugOverlay } from './components/DebugOverlay'
import { LeaderLinesOverlay } from './components/LeaderLinesOverlay'
import { Hero } from './components/Hero'
import { LightweightDesign } from './components/LightweightDesign'
import { WorkingPrinciple } from './components/WorkingPrinciple'
import { ExplodedHardware } from './components/ExplodedHardware'
import { ConnectivitySection } from './components/ConnectivitySection'
import { ResultsSection } from './components/ResultsSection'
import { Footer } from './components/Footer'

const Scene = lazy(() => import('./three/Scene').then((m) => ({ default: m.Scene })))

function SceneLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border border-[#2F6FEF]/30 animate-ping absolute" />
        <div className="w-10 h-10 rounded-full border-2 border-[#2F6FEF] border-t-transparent animate-spin" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#2F6FEF] absolute" />
      </div>
    </div>
  )
}

export default function App() {
  // Initialize Lenis smooth scroll synced with GSAP ticker
  useLenis()
  // Initialize Section 2D scroll-scrubbed explode hook
  useScrollExplode()

  const activeSection = useStore((s) => s.activeSection)
  const isDark = activeSection === 'hero'

  return (
    <div className="relative w-full min-h-screen">
      {/* Background Transition Layer: Dark #121212 for Hero, Light #F7F6F3 for all other sections */}
      <div
        className={`fixed inset-0 z-0 transition-colors duration-700 pointer-events-none ${
          isDark ? 'bg-[#121212] bg-grid-48-dark' : 'bg-[#F7F6F3] bg-grid-48-light'
        }`}
      />

      {/* Persistent Fixed 3D Canvas Layer: Fixed across viewport at z-10 */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <Suspense fallback={<SceneLoader />}>
          <Scene />
        </Suspense>
      </div>

      {/* Atmospheric Post-Processing Layer: Photographic vignette + micro film-grain */}
      <div
        className="fixed inset-0 z-20 pointer-events-none transition-opacity duration-700"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 62% 50%, transparent 38%, rgba(0, 0, 0, 0.55) 100%)'
            : 'radial-gradient(circle at 62% 50%, transparent 46%, rgba(11, 15, 25, 0.07) 100%)',
        }}
      />
      <div className="fixed inset-0 z-20 pointer-events-none film-grain-overlay" />

      {/* Persistent Fixed Navigation & Progress */}
      <Navbar />
      <ProgressTickBar />

      {/* Section 4: Screen-projected Leader Line Labels Overlay (z-40, above section text, below Navbar) */}
      <LeaderLinesOverlay />

      {/* Section 8: On-screen Debug Overlay (toggled via ?debug=1) */}
      <DebugOverlay />

      {/* Main Content Sections (Hero hosts persistent fixed 3D Canvas at z-10) */}
      <main className="relative z-30 w-full">
        <Hero />
        <LightweightDesign />
        <WorkingPrinciple />
        <ExplodedHardware />
        <ConnectivitySection />
        <ResultsSection />
      </main>

      <Footer />
    </div>
  )
}

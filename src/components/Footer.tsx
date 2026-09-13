import { Activity } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative w-full bg-[#121212] text-white border-t border-white/10 px-6 py-14 z-50 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Left Team Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#2F6FEF] text-white flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-sm font-bold tracking-widest uppercase">
              DESULPHERISERS
            </span>
          </div>
          <p className="text-xs font-mono text-gray-400 max-w-md">
            Passive Colorimetric H2S Exposure Dosimeter Wristband with AI-assisted Quantitative Reading.
          </p>
        </div>

        {/* Center / Right Badges */}
        <div className="flex flex-col md:items-end gap-1.5 text-xs font-mono text-gray-400">
          <div className="text-white font-semibold">
            SMART INDIA HACKATHON 2026
          </div>
          <div>LOCAL PROTOTYPE DEMONSTRATION // VITE + THREE.JS</div>
          <div className="text-[10px] text-gray-500">
            ALL HARDWARE PRIMITIVES RENDERED PROCEDURALLY IN REAL-TIME
          </div>
        </div>
      </div>
    </footer>
  )
}

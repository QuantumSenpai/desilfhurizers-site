import { create } from 'zustand'

interface AppState {
  explodeProgress: number
  setExplodeProgress: (value: number) => void
  selectedPartId: string | null
  setSelectedPartId: (id: string | null) => void
  activeSection: string
  setActiveSection: (section: string) => void
  cameraPosition: [number, number, number]
  setCameraPosition: (pos: [number, number, number]) => void
  focusIndex: number
  setFocusIndex: (index: number) => void
}

export const useStore = create<AppState>((set) => ({
  explodeProgress: 0,
  setExplodeProgress: (value) => set({ explodeProgress: Math.max(0, Math.min(1, value)) }),
  selectedPartId: null,
  setSelectedPartId: (id) => set({ selectedPartId: id }),
  activeSection: 'hero',
  setActiveSection: (section) => set({ activeSection: section }),
  cameraPosition: [0, 0, 6.5],
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
  focusIndex: -1,
  setFocusIndex: (index) => set({ focusIndex: index }),
}))

export interface HardwarePart {
  id: string
  name: string
  category: string
  why: string
  how: string
  color: string
  telemetryStatus: string
  /** True for the 2 structural enclosures — shown in Phase A full explode but skipped in Phase B isolation */
  isEnclosure?: boolean
}

// All 8 physical parts — used in full explode overview (Phase A) and reassembly (Phase C).
// HARDWARE_PARTS order matches the 3D model's part index order (0–7).
export const HARDWARE_PARTS: HardwarePart[] = [
  {
    id: 'casing-top',
    name: 'CNC Polycarbonate Housing (Top)',
    category: 'ENCLOSURE',
    why: 'Protective outer housing that seals all internal components.',
    how: 'Durable polymer shell with optical window cutout.',
    color: '#6B7280',
    telemetryStatus: 'SEAL INTEGRITY: IP67 // OPTICAL WINDOW CLEAR',
    isEnclosure: true,
  },
  {
    id: 'h2s-sensor',
    name: 'Fermion MEMS H2S Sensor',
    category: 'DETECTION',
    why: 'Changes color on contact with H2S — the core detection method.',
    how: 'Reagent color shift is captured optically and quantified.',
    color: '#22C55E',
    telemetryStatus: 'REAGENT ΔE: 0.04 // NORMAL (SUBSTRATE ACTIVE)',
  },

  {
    id: 'esp32',
    name: 'Seeed XIAO ESP32S3 (Sense)',
    category: 'PROCESSING',
    why: 'Runs the on-device AI model and manages BLE communication.',
    how: 'TFLite Micro inference processes captured sensor data locally.',
    color: '#2F6FEF',
    telemetryStatus: 'BLE 5.0 // ACTIVE (PRETRAINED ON-DEVICE MODEL)',
  },
  {
    id: 'oled-display',
    name: '1.3" OLED Display',
    category: 'INTERFACE',
    why: 'Shows live PPM readings directly on the wristband.',
    how: 'Low-power screen refreshes with each new measurement.',
    color: '#0891B2',
    telemetryStatus: 'REFRESH 30HZ // ON (QUANTITATIVE PPM HUD)',
  },
  {
    id: 'temp-sensor',
    name: 'SHT30',
    category: 'COMPENSATION',
    why: 'Temperature and humidity affect color-change accuracy.',
    how: 'Readings feed a bias/scale correction into the model.',
    color: '#EAB308',
    telemetryStatus: 'COMPENSATION: ACTIVE (23.4°C / 48% RH)',
  },
  {
    id: 'buzzer-led',
    name: 'Vibration Motor & Buzzer',
    category: 'ALERTS',
    why: 'Alerts the wearer instantly when exposure crosses safe limits.',
    how: 'Triggers automatically on threshold breach from the controller.',
    color: '#E5484D',
    telemetryStatus: 'STATUS: STANDBY // 85DB PIEZO READY',
  },
  {
    id: 'battery',
    name: '3.7V Micro Li-Po Battery',
    category: 'POWER',
    why: 'Powers the wristband for a full industrial work shift.',
    how: 'Li-Po cell sized for continuous BLE and sensing operation.',
    color: '#F97316',
    telemetryStatus: 'CHARGE: 100% // NOMINAL (350MAH LI-PO)',
  },
  {
    id: 'casing-bottom',
    name: 'Hypoallergenic Base Enclosure (Bottom)',
    category: 'ENCLOSURE',
    why: 'Skin-safe base that houses and protects the internal stack.',
    how: 'Medical-grade biocompatible polymer, direct contact rated.',
    color: '#6B7280',
    telemetryStatus: 'BIOCOMPATIBLE // SKIN CONTACT OK',
    isEnclosure: true,
  },
]

/**
 * SHOWCASE_PARTS — The ordered 6 functional components for Phase B isolation.
 * Enclosures are excluded. Order matches the walkthrough sequence:
 * ESP32 → H2S Sensor → Temp Sensor → Buzzer → OLED → Battery
 */
export const SHOWCASE_PARTS: HardwarePart[] = [
  HARDWARE_PARTS.find((p) => p.id === 'esp32')!,
  HARDWARE_PARTS.find((p) => p.id === 'h2s-sensor')!,
  HARDWARE_PARTS.find((p) => p.id === 'temp-sensor')!,
  HARDWARE_PARTS.find((p) => p.id === 'buzzer-led')!,
  HARDWARE_PARTS.find((p) => p.id === 'oled-display')!,
  HARDWARE_PARTS.find((p) => p.id === 'battery')!,
]

/**
 * Single source of truth mapping each component's ID to its 0–5 index in Phase B isolation sequence.
 * Enclosures (casing-top, casing-bottom) are omitted and map to -1.
 * Camera Module removed in V12 — indices after the removal point shifted down by one.
 */
export const SHOWCASE_INDEX_MAP: Record<string, number> = {
  'esp32': 0,
  'h2s-sensor': 1,
  'temp-sensor': 2,
  'buzzer-led': 3,
  'oled-display': 4,
  'battery': 5,
}

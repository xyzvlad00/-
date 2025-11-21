export type VisualMode =
  | 'morph-kaleid'
  | 'fluid'
  | 'tunnel'
  | 'galaxy'
  | 'chromatic'
  | 'neural'
  | 'bars'
  | 'waveform'
  | 'radial'
  | 'orbitals'
  | 'rings'
  | 'grid'
  | 'kaleidoscope'
  | 'liquid'
  | 'fractal'
  | 'constellation'
  | 'city'
  | 'geometric'
  | 'dna'
  | 'matrix'
  | 'explosion'

export type ThemeMode = 'dark' | 'light'

export type AudioStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'error' | 'unsupported' | 'suspended'

export interface BeatInfo {
  isBeat: boolean
  confidence: number
  bpm: number
  energy: number
}

export interface AudioFrame {
  frequencyData: Uint8Array
  waveformData: Uint8Array
  bassEnergy: number
  midEnergy: number
  highEnergy: number
  overallVolume: number
  beatInfo?: BeatInfo
}


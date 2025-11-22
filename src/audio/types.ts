/**
 * Enhanced Audio Types
 */

import type { AudioFrame } from '../state/types'

export interface EnvelopeState {
  fast: number
  slow: number
}

export interface EnhancedAudioFrame extends AudioFrame {
  // Normalized energies (0-1 range with dynamic calibration)
  bassEnergyNorm: number
  midEnergyNorm: number
  highEnergyNorm: number
  overallVolumeNorm: number
  
  // Raw energies (for compatibility)
  bassEnergyRaw: number
  midEnergyRaw: number
  highEnergyRaw: number
  
  // Transient detection
  transientStrength: number
  isTransient: boolean
  
  // Perceptual loudness
  perceivedLoudness: number
  
  // Attack/Release envelopes
  bassEnvelope: EnvelopeState
  midEnvelope: EnvelopeState
  highEnvelope: EnvelopeState
  
  // Peak values
  overallPeak: number
}


/**
 * Per-Mode Configuration Profiles
 * Defines audio mapping and quality scaling for each visual mode
 */

import type { QualityLevel } from '../state/performanceStore'
import type { MappingConfig } from './utils/visualMapping'

export interface ModeQualityConfig {
  // Rendering parameters that scale with quality
  particleCount?: number
  gridSize?: number
  segmentCount?: number
  trailLength?: number
  iterationCount?: number
  sampleDensity?: number
  resolution?: number
  dprMultiplier?: number
}

export interface ModeConfig {
  // Mode identification
  id: string
  name: string
  category: 'light' | 'medium' | 'heavy'
  
  // Audio mapping profile
  audioMapping: MappingConfig
  
  // Quality-specific parameters
  quality: {
    low: ModeQualityConfig
    medium: ModeQualityConfig
    high: ModeQualityConfig
    ultra: ModeQualityConfig
  }
}

export const MODE_CONFIGS: Record<string, ModeConfig> = {
  // ========== LIGHT MODES ==========
  
  'bars': {
    id: 'bars',
    name: 'Spectrum Bars',
    category: 'light',
    audioMapping: {
      bassWeight: 1.2,
      midWeight: 1.0,
      highWeight: 0.9,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.1,
    },
    quality: {
      low: { segmentCount: 64, dprMultiplier: 1.0 },
      medium: { segmentCount: 96, dprMultiplier: 1.0 },
      high: { segmentCount: 128, dprMultiplier: 1.0 },
      ultra: { segmentCount: 128, dprMultiplier: 1.0 },
    },
  },

  'waveform': {
    id: 'waveform',
    name: 'Oscilloscope',
    category: 'light',
    audioMapping: {
      bassWeight: 0.8,
      midWeight: 1.2,
      highWeight: 1.5,
      motionSensitivity: 1.0,
      curve: 'linear',
    },
    quality: {
      low: { sampleDensity: 2, dprMultiplier: 1.0 },
      medium: { sampleDensity: 1, dprMultiplier: 1.0 },
      high: { sampleDensity: 1, dprMultiplier: 1.0 },
      ultra: { sampleDensity: 1, dprMultiplier: 1.0 },
    },
  },

  'constellation': {
    id: 'constellation',
    name: 'Constellation',
    category: 'light',
    audioMapping: {
      bassWeight: 1.0,
      midWeight: 1.0,
      highWeight: 1.3,
      motionSensitivity: 0.9,
      curve: 'exponential',
      curvePower: 1.3,
    },
    quality: {
      low: { particleCount: 80, dprMultiplier: 1.0 },
      medium: { particleCount: 120, dprMultiplier: 1.0 },
      high: { particleCount: 150, dprMultiplier: 1.0 },
      ultra: { particleCount: 200, dprMultiplier: 1.0 },
    },
  },

  'matrix': {
    id: 'matrix',
    name: 'Matrix Rain',
    category: 'light',
    audioMapping: {
      bassWeight: 1.5,
      midWeight: 1.0,
      highWeight: 0.8,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { segmentCount: 20, dprMultiplier: 1.0 },
      medium: { segmentCount: 30, dprMultiplier: 1.0 },
      high: { segmentCount: 40, dprMultiplier: 1.0 },
      ultra: { segmentCount: 50, dprMultiplier: 1.0 },
    },
  },

  'chromatic': {
    id: 'chromatic',
    name: 'Chromatic Waves',
    category: 'light',
    audioMapping: {
      bassWeight: 1.0,
      midWeight: 1.2,
      highWeight: 1.4,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.1,
    },
    quality: {
      low: { sampleDensity: 3, dprMultiplier: 1.0 },
      medium: { sampleDensity: 2, dprMultiplier: 1.0 },
      high: { sampleDensity: 1, dprMultiplier: 1.0 },
      ultra: { sampleDensity: 1, dprMultiplier: 1.0 },
    },
  },

  // ========== MEDIUM MODES ==========

  'radial': {
    id: 'radial',
    name: 'Radial Bloom',
    category: 'medium',
    audioMapping: {
      bassWeight: 1.3,
      midWeight: 1.0,
      highWeight: 0.9,
      motionSensitivity: 1.1,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { segmentCount: 64, dprMultiplier: 1.0 },
      medium: { segmentCount: 80, dprMultiplier: 1.0 },
      high: { segmentCount: 96, dprMultiplier: 1.0 },
      ultra: { segmentCount: 128, dprMultiplier: 1.0 },
    },
  },

  'city': {
    id: 'city',
    name: 'Spectrum City',
    category: 'medium',
    audioMapping: {
      bassWeight: 1.4,
      midWeight: 1.1,
      highWeight: 0.9,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.15,
    },
    quality: {
      low: { segmentCount: 64, dprMultiplier: 0.9 },
      medium: { segmentCount: 80, dprMultiplier: 1.0 },
      high: { segmentCount: 96, dprMultiplier: 1.0 },
      ultra: { segmentCount: 96, dprMultiplier: 1.0 },
    },
  },

  'rings': {
    id: 'rings',
    name: 'Frequency Rings',
    category: 'medium',
    audioMapping: {
      bassWeight: 1.5,
      midWeight: 1.2,
      highWeight: 1.0,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.0,
    },
    quality: {
      low: { segmentCount: 16, dprMultiplier: 1.0 },
      medium: { segmentCount: 24, dprMultiplier: 1.0 },
      high: { segmentCount: 32, dprMultiplier: 1.0 },
      ultra: { segmentCount: 48, dprMultiplier: 1.0 },
    },
  },

  'orbitals': {
    id: 'orbitals',
    name: 'Orbital Particles',
    category: 'medium',
    audioMapping: {
      bassWeight: 1.2,
      midWeight: 1.0,
      highWeight: 1.3,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { particleCount: 60, trailLength: 3, dprMultiplier: 1.0 },
      medium: { particleCount: 80, trailLength: 5, dprMultiplier: 1.0 },
      high: { particleCount: 100, trailLength: 8, dprMultiplier: 1.0 },
      ultra: { particleCount: 120, trailLength: 10, dprMultiplier: 1.0 },
    },
  },

  'kaleidoscope': {
    id: 'kaleidoscope',
    name: 'Kaleidoscope',
    category: 'medium',
    audioMapping: {
      bassWeight: 1.3,
      midWeight: 1.1,
      highWeight: 1.0,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.1,
    },
    quality: {
      low: { segmentCount: 6, dprMultiplier: 0.9 },
      medium: { segmentCount: 8, dprMultiplier: 1.0 },
      high: { segmentCount: 12, dprMultiplier: 1.0 },
      ultra: { segmentCount: 16, dprMultiplier: 1.0 },
    },
  },

  'tunnel': {
    id: 'tunnel',
    name: 'Vortex Tunnel',
    category: 'medium',
    audioMapping: {
      bassWeight: 1.5,
      midWeight: 1.0,
      highWeight: 0.8,
      motionSensitivity: 1.1,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { segmentCount: 40, iterationCount: 15, dprMultiplier: 0.8 },
      medium: { segmentCount: 60, iterationCount: 20, dprMultiplier: 0.9 },
      high: { segmentCount: 80, iterationCount: 25, dprMultiplier: 1.0 },
      ultra: { segmentCount: 100, iterationCount: 30, dprMultiplier: 1.0 },
    },
  },

  // ========== HEAVY MODES ==========

  'fluid': {
    id: 'fluid',
    name: 'Fluid Dynamics',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.4,
      midWeight: 1.1,
      highWeight: 0.9,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.3,
    },
    quality: {
      low: { resolution: 240, particleCount: 4, dprMultiplier: 0.75 },
      medium: { resolution: 360, particleCount: 6, dprMultiplier: 0.85 },
      high: { resolution: 480, particleCount: 8, dprMultiplier: 1.0 },
      ultra: { resolution: 720, particleCount: 10, dprMultiplier: 1.0 },
    },
  },

  'morph-kaleid': {
    id: 'morph-kaleid',
    name: 'Morphing Kaleidoscope',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.3,
      midWeight: 1.0,
      highWeight: 1.2,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.1,
    },
    quality: {
      low: { segmentCount: 6, sampleDensity: 0.6, dprMultiplier: 0.8 },
      medium: { segmentCount: 8, sampleDensity: 0.8, dprMultiplier: 0.9 },
      high: { segmentCount: 8, sampleDensity: 1.0, dprMultiplier: 1.0 },
      ultra: { segmentCount: 12, sampleDensity: 1.0, dprMultiplier: 1.0 },
    },
  },

  'galaxy': {
    id: 'galaxy',
    name: 'Particle Galaxy',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.4,
      midWeight: 1.0,
      highWeight: 1.2,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { particleCount: 400, trailLength: 3, dprMultiplier: 0.8 },
      medium: { particleCount: 600, trailLength: 4, dprMultiplier: 0.9 },
      high: { particleCount: 800, trailLength: 5, dprMultiplier: 1.0 },
      ultra: { particleCount: 1000, trailLength: 7, dprMultiplier: 1.0 },
    },
  },

  'neural': {
    id: 'neural',
    name: 'Neural Network',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.3,
      midWeight: 1.2,
      highWeight: 1.0,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { particleCount: 60, dprMultiplier: 0.8 },
      medium: { particleCount: 80, dprMultiplier: 0.9 },
      high: { particleCount: 96, dprMultiplier: 1.0 },
      ultra: { particleCount: 120, dprMultiplier: 1.0 },
    },
  },

  'grid': {
    id: 'grid',
    name: 'Audio Grid',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.4,
      midWeight: 1.1,
      highWeight: 0.9,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { gridSize: 12, dprMultiplier: 0.75 },
      medium: { gridSize: 16, dprMultiplier: 0.85 },
      high: { gridSize: 20, dprMultiplier: 1.0 },
      ultra: { gridSize: 24, dprMultiplier: 1.0 },
    },
  },

  'dna': {
    id: 'dna',
    name: 'DNA Helix',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.3,
      midWeight: 1.1,
      highWeight: 1.2,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { particleCount: 40, segmentCount: 30, dprMultiplier: 0.8 },
      medium: { particleCount: 60, segmentCount: 38, dprMultiplier: 0.9 },
      high: { particleCount: 80, segmentCount: 45, dprMultiplier: 1.0 },
      ultra: { particleCount: 100, segmentCount: 50, dprMultiplier: 1.0 },
    },
  },

  'liquid': {
    id: 'liquid',
    name: 'Liquid Aurora',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.5,
      midWeight: 1.0,
      highWeight: 1.1,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.3,
    },
    quality: {
      low: { resolution: 120, iterationCount: 2, dprMultiplier: 0.75 },
      medium: { resolution: 180, iterationCount: 3, dprMultiplier: 0.85 },
      high: { resolution: 240, iterationCount: 4, dprMultiplier: 1.0 },
      ultra: { resolution: 360, iterationCount: 5, dprMultiplier: 1.0 },
    },
  },

  'gallery': {
    id: 'gallery',
    name: 'Non-Euclidean Gallery',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.3,
      midWeight: 1.2,
      highWeight: 1.1,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.2,
    },
    quality: {
      low: { particleCount: 3, segmentCount: 15, dprMultiplier: 0.8 },
      medium: { particleCount: 4, segmentCount: 25, dprMultiplier: 0.9 },
      high: { particleCount: 5, segmentCount: 30, dprMultiplier: 1.0 },
      ultra: { particleCount: 6, segmentCount: 40, dprMultiplier: 1.0 },
    },
  },

  'thresholds': {
    id: 'thresholds',
    name: 'Recursive Thresholds',
    category: 'heavy',
    audioMapping: {
      bassWeight: 1.4,
      midWeight: 1.2,
      highWeight: 1.1,
      motionSensitivity: 1.0,
      curve: 'exponential',
      curvePower: 1.15,
    },
    quality: {
      low: { segmentCount: 8, dprMultiplier: 0.75 },
      medium: { segmentCount: 12, dprMultiplier: 0.85 },
      high: { segmentCount: 15, dprMultiplier: 1.0 },
      ultra: { segmentCount: 20, dprMultiplier: 1.0 },
    },
  },
}

/**
 * Get mode config by ID
 */
export function getModeConfig(modeId: string): ModeConfig | undefined {
  return MODE_CONFIGS[modeId]
}

/**
 * Get quality parameters for a mode
 */
export function getQualityParams(modeId: string, qualityLevel: QualityLevel): ModeQualityConfig {
  const config = getModeConfig(modeId)
  if (!config) {
    // Return sensible defaults
    return {
      particleCount: 100,
      gridSize: 16,
      segmentCount: 32,
      trailLength: 5,
      resolution: 480,
      dprMultiplier: 1.0,
    }
  }
  
  return config.quality[qualityLevel]
}

/**
 * Get audio mapping config for a mode
 */
export function getAudioMappingConfig(modeId: string): MappingConfig {
  const config = getModeConfig(modeId)
  return config?.audioMapping ?? {
    bassWeight: 1.0,
    midWeight: 1.0,
    highWeight: 1.0,
    motionSensitivity: 1.0,
    curve: 'exponential',
    curvePower: 1.2,
  }
}


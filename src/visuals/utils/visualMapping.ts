/**
 * Unified Visual Mapping Utilities
 * Provides consistent, perceptually-correct mappings from audio to visual parameters
 */

import type { EnhancedAudioFrame } from '../../audio/types'

export interface MappingConfig {
  // Band emphasis weights
  bassWeight?: number
  midWeight?: number
  highWeight?: number
  
  // Motion sensitivity
  motionSensitivity?: number
  
  // Smoothing
  smoothingFactor?: number
  
  // Visual range
  minValue?: number
  maxValue?: number
  
  // Curve type
  curve?: 'linear' | 'exponential' | 'logarithmic' | 'sigmoid'
  curvePower?: number
}

const DEFAULT_CONFIG: Required<MappingConfig> = {
  bassWeight: 1.0,
  midWeight: 1.0,
  highWeight: 1.0,
  motionSensitivity: 1.0,
  smoothingFactor: 0.2,
  minValue: 0,
  maxValue: 1,
  curve: 'exponential',
  curvePower: 1.2,
}

/**
 * Map band energy to radius/scale with perceptual curve
 */
export function mapBandEnergyToRadius(
  frame: EnhancedAudioFrame,
  band: 'bass' | 'mid' | 'high' | 'overall',
  baseRadius: number,
  maxMultiplier: number = 2.0,
  config: Partial<MappingConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  let energy: number
  switch (band) {
    case 'bass':
      energy = frame.bassEnergyNorm * cfg.bassWeight
      break
    case 'mid':
      energy = frame.midEnergyNorm * cfg.midWeight
      break
    case 'high':
      energy = frame.highEnergyNorm * cfg.highWeight
      break
    case 'overall':
      energy = frame.perceivedLoudness
      break
  }
  
  energy = applyCurve(energy, cfg.curve, cfg.curvePower)
  energy *= cfg.motionSensitivity
  
  return baseRadius * (1 + energy * (maxMultiplier - 1))
}

/**
 * Map energy to color hue shift
 */
export function mapEnergyToHueShift(
  frame: EnhancedAudioFrame,
  baseHue: number,
  maxShift: number = 180,
  config: Partial<MappingConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const combinedEnergy =
    frame.bassEnergyNorm * cfg.bassWeight * 0.4 +
    frame.midEnergyNorm * cfg.midWeight * 0.3 +
    frame.highEnergyNorm * cfg.highWeight * 0.3
  
  const shift = combinedEnergy * maxShift * cfg.motionSensitivity
  return (baseHue + shift) % 360
}

/**
 * Map energy to brightness/lightness
 */
export function mapEnergyToBrightness(
  energy: number,
  baseLightness: number = 50,
  range: number = 30,
  config: Partial<MappingConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const curved = applyCurve(energy, cfg.curve, cfg.curvePower)
  const adjusted = curved * cfg.motionSensitivity
  
  return Math.max(0, Math.min(100, baseLightness + adjusted * range))
}

/**
 * Map energy to scale with min/max bounds
 */
export function mapEnergyToScale(
  energy: number,
  minScale: number,
  maxScale: number,
  config: Partial<MappingConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const curved = applyCurve(energy, cfg.curve, cfg.curvePower)
  const adjusted = curved * cfg.motionSensitivity
  
  return minScale + adjusted * (maxScale - minScale)
}

/**
 * Map frequency index to energy with automatic band detection
 */
export function mapFrequencyIndexToEnergy(
  frame: EnhancedAudioFrame,
  index: number,
  totalCount: number,
  sensitivity: number = 1.0
): number {
  const ratio = index / totalCount
  const freqValue = frame.frequencyData[Math.floor(ratio * frame.frequencyData.length)] / 255
  
  let bandEnergy: number
  let curvePower: number
  
  if (ratio < 0.25) {
    // Bass range
    bandEnergy = frame.bassEnergyNorm
    curvePower = 0.9
  } else if (ratio < 0.7) {
    // Mid range
    bandEnergy = frame.midEnergyNorm
    curvePower = 1.1
  } else {
    // High range
    bandEnergy = frame.highEnergyNorm
    curvePower = 1.3
  }
  
  const enhanced = Math.pow(freqValue, curvePower) * (1 + bandEnergy * 0.5)
  return enhanced * sensitivity
}

/**
 * Map combined energy to opacity
 */
export function mapEnergyToOpacity(
  energy: number,
  minOpacity: number = 0.3,
  maxOpacity: number = 1.0,
  config: Partial<MappingConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const curved = applyCurve(energy, cfg.curve, cfg.curvePower)
  const adjusted = curved * cfg.motionSensitivity
  
  return Math.max(0, Math.min(1, minOpacity + adjusted * (maxOpacity - minOpacity)))
}

/**
 * Get weighted combined energy from all bands
 */
export function getCombinedEnergy(
  frame: EnhancedAudioFrame,
  config: Partial<MappingConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const totalWeight = cfg.bassWeight + cfg.midWeight + cfg.highWeight
  
  return (
    (frame.bassEnergyNorm * cfg.bassWeight +
      frame.midEnergyNorm * cfg.midWeight +
      frame.highEnergyNorm * cfg.highWeight) /
    totalWeight
  )
}

/**
 * Apply smoothing to value with configurable factor
 */
export function applySmoothing(
  previousValue: number,
  targetValue: number,
  smoothingFactor: number = 0.2
): number {
  return previousValue + (targetValue - previousValue) * smoothingFactor
}

/**
 * Apply curve transformation to normalized value
 */
function applyCurve(
  value: number,
  curve: 'linear' | 'exponential' | 'logarithmic' | 'sigmoid',
  power: number = 1.2
): number {
  value = Math.max(0, Math.min(1, value))
  
  switch (curve) {
    case 'linear':
      return value
    
    case 'exponential':
      return Math.pow(value, power)
    
    case 'logarithmic':
      // Inverse exponential
      return Math.pow(value, 1 / power)
    
    case 'sigmoid':
      // Smooth S-curve
      const x = (value - 0.5) * 6 // Map to wider range for sigmoid
      return 1 / (1 + Math.exp(-x))
    
    default:
      return value
  }
}

/**
 * Logarithmic amplitude mapping for volume-based effects
 */
export function mapAmplitudeLogarithmic(
  amplitude: number,
  minDb: number = -60,
  maxDb: number = 0
): number {
  if (amplitude <= 0) return 0
  
  // Convert to decibels
  const db = 20 * Math.log10(amplitude)
  
  // Normalize to [0, 1]
  return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)))
}

/**
 * Map transient strength to visual pulse
 */
export function mapTransientToPulse(
  frame: EnhancedAudioFrame,
  basePulse: number = 1.0,
  maxPulse: number = 2.0
): number {
  const transientEffect = frame.transientStrength * 2
  return basePulse + transientEffect * (maxPulse - basePulse)
}

/**
 * Map beat detection to flash intensity
 */
export function mapBeatToFlash(
  frame: EnhancedAudioFrame,
  baseIntensity: number = 0,
  flashIntensity: number = 0.8
): number {
  if (frame.beatInfo?.isBeat) {
    return baseIntensity + frame.beatInfo.confidence * flashIntensity
  }
  return baseIntensity
}

/**
 * Clamp value to range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}

/**
 * Smooth step interpolation (ease-in-out)
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Map frequency ratio (0-1) to visual frequency emphasis
 */
export function mapFrequencyRatioToEmphasis(
  ratio: number,
  frame: EnhancedAudioFrame
): number {
  if (ratio < 0.25) {
    return 0.8 + frame.bassEnergyNorm * 0.4
  } else if (ratio < 0.7) {
    return 0.9 + frame.midEnergyNorm * 0.3
  } else {
    return 0.95 + frame.highEnergyNorm * 0.2
  }
}

/**
 * Create color from audio energy
 */
export interface ColorRGB {
  r: number
  g: number
  b: number
}

export function mapEnergyToColorRGB(
  frame: EnhancedAudioFrame,
  config: Partial<MappingConfig> = {}
): ColorRGB {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  return {
    r: Math.floor(frame.bassEnergyNorm * 255 * cfg.bassWeight),
    g: Math.floor(frame.midEnergyNorm * 255 * cfg.midWeight),
    b: Math.floor(frame.highEnergyNorm * 255 * cfg.highWeight),
  }
}

/**
 * Distance-based attenuation for spatial effects
 */
export function applyDistanceAttenuation(
  value: number,
  distance: number,
  maxDistance: number,
  falloff: number = 2.0
): number {
  if (distance >= maxDistance) return 0
  const normalized = distance / maxDistance
  return value * Math.pow(1 - normalized, falloff)
}


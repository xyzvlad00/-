/**
 * Audio utility functions for visual effects
 * Provides consistent audio analysis and mapping helpers
 */

import type { AudioFrame } from '../../state/types'

/**
 * Apply easing curve to audio value
 */
export function easeAudio(value: number, power: number = 1.0): number {
  return Math.pow(Math.max(0, Math.min(1, value)), power)
}

/**
 * Map frequency index to audio data with bounds checking
 */
export function getFrequencyValue(data: Uint8Array, index: number): number {
  return data[Math.min(Math.max(0, Math.floor(index)), data.length - 1)] / 255
}

/**
 * Get frequency value for normalized position (0-1)
 */
export function getFrequencyAtRatio(data: Uint8Array, ratio: number): number {
  const index = Math.floor(ratio * data.length)
  return getFrequencyValue(data, index)
}

/**
 * Calculate average frequency in a range
 */
export function getFrequencyRange(data: Uint8Array, startRatio: number, endRatio: number): number {
  const startIndex = Math.floor(startRatio * data.length)
  const endIndex = Math.floor(endRatio * data.length)
  
  let sum = 0
  let count = 0
  
  for (let i = startIndex; i < endIndex && i < data.length; i++) {
    sum += data[i]
    count++
  }
  
  return count > 0 ? sum / count / 255 : 0
}

/**
 * Apply sensitivity scaling with optional frequency-specific boost
 */
export function applySensitivity(
  value: number,
  sensitivity: number,
  frequencyBoost: number = 1.0,
): number {
  return value * sensitivity * frequencyBoost
}

/**
 * Get audio energy with frequency-specific easing
 */
export function getAudioEnergy(
  frame: AudioFrame,
  index: number,
  totalCount: number,
  sensitivity: number,
): number {
  const ratio = index / totalCount
  const freqValue = getFrequencyAtRatio(frame.frequencyData, ratio)
  
  let power: number
  let boost: number
  
  if (ratio < 0.25) {
    // Bass range
    power = 1.0
    boost = 1 + frame.bassEnergy * 0.5
  } else if (ratio < 0.7) {
    // Mid range
    power = 1.2
    boost = 1 + frame.midEnergy * 0.35
  } else {
    // High range
    power = 1.4
    boost = 1 + frame.highEnergy * 0.4
  }
  
  return easeAudio(freqValue, power) * sensitivity * boost
}

/**
 * Smooth audio value with interpolation
 */
export function smoothAudio(current: number, target: number, smoothing: number = 0.2): number {
  return current + (target - current) * smoothing
}

/**
 * Threshold filter for audio values
 */
export function thresholdAudio(value: number, threshold: number): number {
  return value < threshold ? 0 : value
}

/**
 * Map audio value to range
 */
export function mapAudioToRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const normalized = (value - inMin) / (inMax - inMin)
  return outMin + normalized * (outMax - outMin)
}

/**
 * Get peak detection with decay
 */
export class PeakDetector {
  private peaks: number[] = []
  private decayRate: number

  constructor(count: number, decayRate: number = 0.95) {
    this.peaks = new Array(count).fill(0)
    this.decayRate = decayRate
  }

  update(index: number, value: number): { current: number; peak: number; isPeak: boolean } {
    const isPeak = value > this.peaks[index]
    
    if (isPeak) {
      this.peaks[index] = value
    } else {
      this.peaks[index] *= this.decayRate
    }
    
    return {
      current: value,
      peak: this.peaks[index],
      isPeak,
    }
  }

  getPeak(index: number): number {
    return this.peaks[index]
  }

  reset() {
    this.peaks.fill(0)
  }
}

/**
 * Beat detection with adaptive threshold
 */
export class BeatDetector {
  private history: number[] = []
  private readonly historySize: number
  private threshold: number

  constructor(historySize: number = 43, threshold: number = 1.5) {
    this.historySize = historySize
    this.threshold = threshold
  }

  detect(energy: number): boolean {
    this.history.push(energy)
    if (this.history.length > this.historySize) {
      this.history.shift()
    }

    if (this.history.length < this.historySize) {
      return false
    }

    const average = this.history.reduce((sum, val) => sum + val, 0) / this.history.length
    return energy > average * this.threshold
  }

  reset() {
    this.history = []
  }
}

/**
 * Frequency band analyzer
 */
export interface FrequencyBands {
  bass: number
  lowMid: number
  mid: number
  highMid: number
  high: number
}

export function analyzeFrequencyBands(data: Uint8Array): FrequencyBands {
  return {
    bass: getFrequencyRange(data, 0, 0.1),
    lowMid: getFrequencyRange(data, 0.1, 0.3),
    mid: getFrequencyRange(data, 0.3, 0.6),
    highMid: getFrequencyRange(data, 0.6, 0.8),
    high: getFrequencyRange(data, 0.8, 1.0),
  }
}


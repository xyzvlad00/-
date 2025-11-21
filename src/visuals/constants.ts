/**
 * Shared constants for visual effects
 * Centralized configuration values
 */

// Audio frequency ranges (Hz)
export const FREQUENCY_RANGES = {
  BASS: { min: 20, max: 250 } as const,
  MID: { min: 250, max: 2000 } as const,
  HIGH: { min: 2000, max: 16000 } as const,
} as const

// Common easing power curves
export const EASING_CURVES = {
  BASS: 0.8,
  MID: 1.0,
  HIGH: 1.2,
  SMOOTH: 1.5,
} as const

// Sensitivity multipliers
export const SENSITIVITY = {
  MIN: 0.5,
  MAX: 2.0,
  DEFAULT: 1.0,
  STEP: 0.1,
} as const

// Performance thresholds
export const PERFORMANCE = {
  TARGET_FPS: 60,
  MIN_FRAME_TIME: 16.67, // ms
  FULLSCREEN_1080P: 2073600, // pixels
  FULLSCREEN_1440P: 3686400,
  FULLSCREEN_4K: 8294400,
} as const

// Common rendering values
export const RENDERING = {
  SEGMENTS_LOW: 16,
  SEGMENTS_MID: 32,
  SEGMENTS_HIGH: 64,
  TRAIL_LENGTH: 15,
  PARTICLE_LIMIT: 1000,
} as const

// Color constants
export const COLORS = {
  HUE_RANGE: 360,
  SATURATION_BASE: 85,
  LIGHTNESS_BASE: 60,
} as const

// Audio thresholds
export const THRESHOLDS = {
  SILENCE: 0.05,
  LOW: 0.15,
  MEDIUM: 0.4,
  HIGH: 0.7,
  PEAK: 0.9,
} as const

// Animation timing
export const TIMING = {
  TRANSITION_SHORT: 1, // seconds
  TRANSITION_MEDIUM: 2,
  TRANSITION_LONG: 3,
  HOLD_MIN: 8,
  HOLD_MAX: 28,
} as const


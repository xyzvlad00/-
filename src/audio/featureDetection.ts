/**
 * Feature detection utilities for Web Audio API and browser capabilities
 */

export interface BrowserCapabilities {
  hasWebAudio: boolean
  hasGetUserMedia: boolean
  hasFullscreen: boolean
  hasRequestAnimationFrame: boolean
  hasWebGL: boolean
  audioContextType: 'AudioContext' | 'webkitAudioContext' | null
  recommendedBrowser: string | null
}

/**
 * Detect if Web Audio API is supported
 */
export function hasWebAudioSupport(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext)
}

/**
 * Detect if getUserMedia is supported
 */
export function hasGetUserMediaSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

/**
 * Detect if Fullscreen API is supported
 */
export function hasFullscreenSupport(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  )
}

/**
 * Detect if requestAnimationFrame is supported
 */
export function hasRequestAnimationFrameSupport(): boolean {
  return !!window.requestAnimationFrame
}

/**
 * Detect if WebGL is supported
 */
export function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch (e) {
    return false
  }
}

/**
 * Get AudioContext constructor (with webkit prefix fallback)
 */
export function getAudioContextConstructor(): typeof AudioContext | null {
  if (window.AudioContext) {
    return window.AudioContext
  }
  if ((window as any).webkitAudioContext) {
    return (window as any).webkitAudioContext
  }
  return null
}

/**
 * Detect all browser capabilities
 */
export function detectCapabilities(): BrowserCapabilities {
  const hasWebAudio = hasWebAudioSupport()
  const hasGetUserMedia = hasGetUserMediaSupport()
  const hasFullscreen = hasFullscreenSupport()
  const hasRequestAnimationFrame = hasRequestAnimationFrameSupport()
  const hasWebGL = hasWebGLSupport()

  let audioContextType: BrowserCapabilities['audioContextType'] = null
  if (window.AudioContext) {
    audioContextType = 'AudioContext'
  } else if ((window as any).webkitAudioContext) {
    audioContextType = 'webkitAudioContext'
  }

  // Recommend browsers based on missing features
  let recommendedBrowser: string | null = null
  if (!hasWebAudio || !hasGetUserMedia) {
    recommendedBrowser = 'Chrome 90+, Firefox 88+, Edge 90+, or Safari 14+'
  }

  return {
    hasWebAudio,
    hasGetUserMedia,
    hasFullscreen,
    hasRequestAnimationFrame,
    hasWebGL,
    audioContextType,
    recommendedBrowser,
  }
}

/**
 * Get user-friendly error message for missing features
 */
export function getUnsupportedFeatureMessage(capabilities: BrowserCapabilities): string | null {
  if (!capabilities.hasWebAudio) {
    return 'Web Audio API is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.'
  }
  
  if (!capabilities.hasGetUserMedia) {
    return 'Microphone access is not available in this browser. Please use a modern browser with getUserMedia support.'
  }

  if (!capabilities.hasRequestAnimationFrame) {
    return 'This browser is too old to run audio visualizations. Please update to a modern browser.'
  }

  return null
}

/**
 * Check if browser is Safari
 */
export function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

/**
 * Check if browser is iOS Safari
 */
export function isiOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Check if browser is mobile
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Get browser info for debugging
 */
export function getBrowserInfo(): {
  userAgent: string
  platform: string
  isSafari: boolean
  isiOS: boolean
  isMobile: boolean
} {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isSafari: isSafari(),
    isiOS: isiOS(),
    isMobile: isMobile(),
  }
}


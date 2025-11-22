import { create } from 'zustand'

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra'

export interface PerformanceMetrics {
  currentFPS: number
  averageFPS: number
  frameTime: number
  isFullscreen: boolean
  qualityLevel: QualityLevel
  effectiveDPR: number
}

interface PerformanceState extends PerformanceMetrics {
  // FPS tracking
  fpsHistory: number[]
  lastFrameTime: number
  frameCount: number
  
  // Quality scaling
  targetFPS: number
  qualityChangeTimer: number
  lastQualityChange: number
  
  // Actions
  updateFPS: (fps: number) => void
  setFullscreen: (isFullscreen: boolean) => void
  setQualityLevel: (level: QualityLevel) => void
  adjustQualityForPerformance: () => void
  getEffectiveDPR: () => number
  reset: () => void
}

const TARGET_FPS = 60
const FPS_HISTORY_SIZE = 60 // 1 second of samples
const QUALITY_CHANGE_COOLDOWN = 3000 // 3 seconds between changes
const LOW_FPS_THRESHOLD = 45
const HIGH_FPS_THRESHOLD = 55

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  // Initial state
  currentFPS: 60,
  averageFPS: 60,
  frameTime: 16.67,
  isFullscreen: false,
  qualityLevel: 'high',
  effectiveDPR: Math.min(window.devicePixelRatio || 1, 2),
  fpsHistory: [],
  lastFrameTime: performance.now(),
  frameCount: 0,
  targetFPS: TARGET_FPS,
  qualityChangeTimer: 0,
  lastQualityChange: 0,

  updateFPS: (fps: number) => {
    const state = get()
    const now = performance.now()
    const frameTime = now - state.lastFrameTime
    
    set((prevState) => {
      const newHistory = [...prevState.fpsHistory, fps]
      if (newHistory.length > FPS_HISTORY_SIZE) {
        newHistory.shift()
      }
      
      const averageFPS = newHistory.reduce((sum, val) => sum + val, 0) / newHistory.length
      
      return {
        currentFPS: fps,
        averageFPS,
        frameTime,
        fpsHistory: newHistory,
        lastFrameTime: now,
        frameCount: prevState.frameCount + 1,
      }
    })
  },

  setFullscreen: (isFullscreen: boolean) => {
    set({ isFullscreen })
    
    // Reset quality to high when entering fullscreen
    if (isFullscreen) {
      set({ qualityLevel: 'high', fpsHistory: [] })
    }
  },

  setQualityLevel: (qualityLevel: QualityLevel) => {
    const now = Date.now()
    const state = get()
    
    // Calculate DPR directly without calling getEffectiveDPR to avoid circular updates
    const deviceDPR = window.devicePixelRatio || 1
    let newDPR = 1.5
    
    if (!state.isFullscreen) {
      newDPR = Math.min(deviceDPR, 2.0)
    } else {
      switch (qualityLevel) {
        case 'low':
          newDPR = 1.0
          break
        case 'medium':
          newDPR = Math.min(deviceDPR, 1.25)
          break
        case 'high':
          newDPR = Math.min(deviceDPR, 1.5)
          break
        case 'ultra':
          newDPR = Math.min(deviceDPR, 2.0)
          break
      }
    }
    
    set({
      qualityLevel,
      lastQualityChange: now,
      effectiveDPR: newDPR,
    })
    
    console.log(`[Performance] Quality set to: ${qualityLevel}`)
  },

  adjustQualityForPerformance: () => {
    const state = get()
    const now = Date.now()
    
    // Don't adjust if not enough history
    if (state.fpsHistory.length < 30) return
    
    // Don't adjust too frequently
    if (now - state.lastQualityChange < QUALITY_CHANGE_COOLDOWN) return
    
    const { averageFPS, qualityLevel, isFullscreen } = state
    
    // Only auto-adjust in fullscreen
    if (!isFullscreen) return
    
    // Check if we need to decrease quality
    if (averageFPS < LOW_FPS_THRESHOLD) {
      switch (qualityLevel) {
        case 'ultra':
          state.setQualityLevel('high')
          break
        case 'high':
          state.setQualityLevel('medium')
          break
        case 'medium':
          state.setQualityLevel('low')
          break
        // Already at low, can't go lower
      }
    }
    // Check if we can increase quality
    else if (averageFPS > HIGH_FPS_THRESHOLD) {
      switch (qualityLevel) {
        case 'low':
          state.setQualityLevel('medium')
          break
        case 'medium':
          state.setQualityLevel('high')
          break
        case 'high':
          state.setQualityLevel('ultra')
          break
        // Already at ultra, can't go higher
      }
    }
  },

  getEffectiveDPR: () => {
    const { qualityLevel, isFullscreen } = get()
    const deviceDPR = window.devicePixelRatio || 1
    
    if (!isFullscreen) {
      // Normal mode: cap at 2
      return Math.min(deviceDPR, 2.0)
    }
    
    // Fullscreen: adjust DPR based on quality
    switch (qualityLevel) {
      case 'low':
        return 1.0
      case 'medium':
        return Math.min(deviceDPR, 1.25)
      case 'high':
        return Math.min(deviceDPR, 1.5)
      case 'ultra':
        return Math.min(deviceDPR, 2.0)
      default:
        return 1.5
    }
  },

  reset: () => {
    set({
      currentFPS: 60,
      averageFPS: 60,
      frameTime: 16.67,
      fpsHistory: [],
      lastFrameTime: performance.now(),
      frameCount: 0,
      qualityChangeTimer: 0,
    })
  },
}))

// Auto-adjust quality every second
if (typeof window !== 'undefined') {
  setInterval(() => {
    usePerformanceStore.getState().adjustQualityForPerformance()
  }, 1000)
}


import { useEffect, useRef } from 'react'
import type { DependencyList, RefObject } from 'react'
import { enhancedAudioEngine } from '../audio/EnhancedAudioEngine'
import type { EnhancedAudioFrame } from '../audio/types'
import { usePerformanceStore } from '../state/performanceStore'
import { getModeConfig, getQualityParams } from './modeConfigs'

type DrawHandler = (
  ctx: CanvasRenderingContext2D,
  dims: { width: number; height: number },
  frame: EnhancedAudioFrame,
  time: number,
  delta: number,
) => void

export function useEnhancedCanvasLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  draw: DrawHandler,
  deps: DependencyList = [],
) {
  const lastFPSUpdate = useRef(0)
  const frameCount = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let raf: number
    let lastTime = performance.now()
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined

    const resize = () => {
      const performanceState = usePerformanceStore.getState()
      const effectiveDPR = performanceState.getEffectiveDPR()
      
      const bounds = canvas.getBoundingClientRect()
      const fallbackWidth = canvas.width || 640
      const fallbackHeight = canvas.height || 360
      const width = (bounds.width || fallbackWidth) * effectiveDPR
      const height = (bounds.height || fallbackHeight) * effectiveDPR
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(effectiveDPR, effectiveDPR)
    }

    const render = (time: number) => {
      const delta = time - lastTime
      lastTime = time

      // Update FPS tracking
      frameCount.current++
      const now = performance.now()
      if (now - lastFPSUpdate.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastFPSUpdate.current))
        usePerformanceStore.getState().updateFPS(fps)
        frameCount.current = 0
        lastFPSUpdate.current = now
      }

      const frame = enhancedAudioEngine.getFrame()
      draw(ctx, { width: canvas.clientWidth, height: canvas.clientHeight }, frame, time, delta)
      raf = requestAnimationFrame(render)
    }

    // Debounced resize handler
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resize, 100)
    }

    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resize, 100)
    })

    // Initial resize (immediate, no debounce)
    resize()

    resizeObserver.observe(canvas)
    window.addEventListener('resize', handleResize)
    
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      usePerformanceStore.getState().setFullscreen(isFullscreen)
      // Trigger resize when entering/exiting fullscreen
      setTimeout(resize, 100)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // Start render loop
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      resizeObserver.disconnect()
    }
  }, deps)
}

/**
 * Hook to get current quality parameters for a mode
 */
export function useQualityParams(modeId: string) {
  const qualityLevel = usePerformanceStore((state) => state.qualityLevel)
  return getQualityParams(modeId, qualityLevel)
}

/**
 * Hook to get audio mapping config for a mode
 */
export function useAudioMappingConfig(modeId: string) {
  const config = getModeConfig(modeId)
  return config?.audioMapping ?? {
    bassWeight: 1.0,
    midWeight: 1.0,
    highWeight: 1.0,
    motionSensitivity: 1.0,
    curve: 'exponential' as const,
    curvePower: 1.2,
  }
}


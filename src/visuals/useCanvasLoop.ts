import { useEffect } from 'react'
import type { DependencyList, RefObject } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import type { AudioFrame } from '../state/types'

type DrawHandler = (ctx: CanvasRenderingContext2D, dims: { width: number; height: number }, frame: AudioFrame, time: number, delta: number) => void

export function useCanvasLoop(canvasRef: RefObject<HTMLCanvasElement | null>, draw: DrawHandler, deps: DependencyList = []) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let lastTime = performance.now()

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      const bounds = canvas.getBoundingClientRect()
      const fallbackWidth = canvas.width || 640
      const fallbackHeight = canvas.height || 360
      const width = (bounds.width || fallbackWidth) * ratio
      const height = (bounds.height || fallbackHeight) * ratio
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(ratio, ratio)
    }

    const render = (time: number) => {
      const delta = time - lastTime
      lastTime = time
      const frame = audioEngine.getFrame()
      draw(ctx, { width: canvas.clientWidth, height: canvas.clientHeight }, frame, time, delta)
      raf = requestAnimationFrame(render)
    }

    const handleResize = () => resize()
    const resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(canvas)
    window.addEventListener('resize', handleResize)
    resize()
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
    }
  }, deps)
}


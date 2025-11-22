import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'

interface Star {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

function createStars(width: number, height: number, count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    life: Math.random() * 200,
  }))
}

function Constellation({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('constellation')
  const audioConfig = useAudioMappingConfig('constellation')
  const starsRef = useRef<Star[]>([])
  
  const STAR_COUNT = qualityParams.particleCount || 120

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      if (starsRef.current.length === 0 || Math.abs(starsRef.current.length - STAR_COUNT) > 10) {
        starsRef.current = createStars(width, height, STAR_COUNT)
      }

      ctx.fillStyle = 'rgba(5,6,10,0.55)'
      ctx.fillRect(0, 0, width, height)

      const maxDistance = 140 + frame.midEnergyNorm * 200 * sensitivity * (audioConfig.midWeight || 1.0)
      starsRef.current.forEach((star) => {
        star.x += star.vx * (1 + frame.highEnergy)
        star.y += star.vy * (1 + frame.highEnergy)
        star.life -= 0.5

        if (star.x < 0 || star.x > width) star.vx *= -1
        if (star.y < 0 || star.y > height) star.vy *= -1
        if (star.life <= 0) {
          star.x = Math.random() * width
          star.y = Math.random() * height
          star.life = 200
        }

        ctx.fillStyle = `rgba(255,255,255,${0.2 + frame.highEnergy * 0.5})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, 1.5 + frame.highEnergy * 3, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.strokeStyle = 'rgba(64,243,255,0.3)'
      for (let i = 0; i < starsRef.current.length; i += 1) {
        for (let j = i + 1; j < starsRef.current.length; j += 1) {
          const a = starsRef.current[i]
          const b = starsRef.current[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxDistance) {
            const alpha = 1 - dist / maxDistance
            ctx.strokeStyle = `rgba(64,243,255,${alpha * (0.2 + frame.overallVolume)})`
            ctx.lineWidth = alpha * (frame.highEnergy * 1.5 + 0.2)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
    },
    [sensitivity, STAR_COUNT],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/20" />
}

export default Constellation

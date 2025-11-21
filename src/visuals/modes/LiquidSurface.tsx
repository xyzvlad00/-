import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'

export function LiquidSurface({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offsets = useRef({
    x: Math.random() * 1000,
    y: Math.random() * 1000,
  })

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame, time, delta) => {
      const { width, height } = dims
      ctx.clearRect(0, 0, width, height)

      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, `rgba(64, 243, 255, ${0.2 + frame.midEnergy * 0.4})`)
      gradient.addColorStop(1, `rgba(255, 100, 180, ${0.2 + frame.highEnergy * 0.5})`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      const amplitude = 40 + frame.bassEnergy * 120 * sensitivity
      const viscosity = 0.0015 * (frame.highEnergy + 0.3)
      offsets.current.x += delta * viscosity
      offsets.current.y += delta * viscosity * 0.9

      const resolution = 6
      for (let y = 0; y < height; y += resolution) {
        const rowEnergy = Math.sin(y * 0.01 + time * 0.0006) * frame.midEnergy * 10
        ctx.beginPath()
        for (let x = 0; x < width; x += resolution) {
          const noise =
            Math.sin(x * 0.01 + offsets.current.x) + Math.cos(y * 0.01 + offsets.current.y) + Math.sin((x + y) * 0.005)
          const intensity = noise * amplitude * 0.02 + frame.overallVolume * amplitude
          const targetY = y + Math.sin(x * 0.02 + time * 0.001) * amplitude * 0.2 + rowEnergy + intensity
          ctx.lineTo(x, targetY)
        }
        ctx.lineWidth = 2
        ctx.strokeStyle = `hsla(${200 + frame.highEnergy * 80}, 80%, 65%, 0.4)`
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = `rgba(255,255,255,${0.02 + frame.highEnergy * 0.12})`
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 120 + frame.overallVolume * 180, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}


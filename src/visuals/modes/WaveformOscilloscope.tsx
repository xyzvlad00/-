import { useMemo, useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'

export function WaveformOscilloscope({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glow = useMemo(
    () => (theme === 'dark' ? 'rgba(64,243,255,0.4)' : 'rgba(0,40,80,0.3)'),
    [theme],
  )

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const time = Date.now() * 0.001
      
      ctx.fillStyle = theme === 'dark' ? 'rgba(5,6,10,0.2)' : 'rgba(245,247,255,0.4)'
      ctx.fillRect(0, 0, width, height)

      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, `hsla(${180 + time * 20}, 80%, 60%, 0.9)`)
      gradient.addColorStop(0.5, `hsla(${220 + time * 20}, 85%, 65%, 1)`)
      gradient.addColorStop(1, `hsla(${260 + time * 20}, 80%, 60%, 0.9)`)

      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = gradient
      ctx.shadowColor = glow
      ctx.shadowBlur = 20

      ctx.beginPath()
      const slice = width / frame.waveformData.length
      for (let i = 0; i < frame.waveformData.length; i += 1) {
        const x = i * slice
        const normalized = (frame.waveformData[i] / 255 - 0.5) * 2
        const y = height / 2 + normalized * (height / 2) * sensitivity * 1.2
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      ctx.shadowBlur = 8
      ctx.strokeStyle = 'rgba(64,243,255,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    },
    [sensitivity, theme, glow],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/10" />
}


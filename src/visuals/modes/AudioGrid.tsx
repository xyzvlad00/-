import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'

const GRID_SIZE = 16

export function AudioGrid({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      ctx.fillStyle = 'rgba(5,6,10,0.55)'
      ctx.fillRect(0, 0, width, height)

      const cellWidth = width / GRID_SIZE
      const cellHeight = height / GRID_SIZE
      const binsPerCell = Math.max(1, Math.floor(frame.frequencyData.length / (GRID_SIZE * GRID_SIZE)))

      for (let y = 0; y < GRID_SIZE; y += 1) {
        for (let x = 0; x < GRID_SIZE; x += 1) {
          const index = (y * GRID_SIZE + x) * binsPerCell
          const magnitude = frame.frequencyData[Math.min(index, frame.frequencyData.length - 1)] / 255
          const elevated = Math.pow(magnitude, 1.5) * sensitivity
          const heightScale = elevated * cellHeight * 1.4

          ctx.fillStyle = `hsla(${180 + magnitude * 160}, 70%, ${30 + magnitude * 50}%, ${0.5 + elevated * 0.5})`
          ctx.save()
          ctx.translate(x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2)
          ctx.beginPath()
          ctx.rect(-cellWidth / 2 + 2, -cellHeight / 2 + heightScale / 4, cellWidth - 4, heightScale)
          ctx.fill()
          ctx.restore()
        }
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/20" />
}


import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { mapFrequencyIndexToEnergy } from '../utils/visualMapping'

interface GridCell {
  currentHeight: number
  targetHeight: number
  color: { h: number; s: number; l: number }
}

function AudioGrid({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('grid')
  const audioConfig = useAudioMappingConfig('grid')
  const gridRef = useRef<GridCell[][]>([])
  const timeRef = useRef(0)
  
  const GRID_SIZE = qualityParams.gridSize || 20

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      timeRef.current += 0.016
      
      // Dark background with subtle gradient
      const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height))
      bgGradient.addColorStop(0, 'rgba(5, 8, 15, 1)')
      bgGradient.addColorStop(0.6, 'rgba(3, 5, 10, 1)')
      bgGradient.addColorStop(1, 'rgba(1, 2, 5, 1)')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Initialize grid if needed
      if (gridRef.current.length !== GRID_SIZE) {
        gridRef.current = Array.from({ length: GRID_SIZE }, () =>
          Array.from({ length: GRID_SIZE }, () => ({
            currentHeight: 0,
            targetHeight: 0,
            color: { h: 180, s: 70, l: 50 },
          })),
        )
      }

      const cellWidth = width / GRID_SIZE
      const cellHeight = height / GRID_SIZE
      const totalCells = GRID_SIZE * GRID_SIZE

      // Update grid cells with enhanced audio mapping
      for (let y = 0; y < GRID_SIZE; y += 1) {
        for (let x = 0; x < GRID_SIZE; x += 1) {
          const cellIndex = y * GRID_SIZE + x
          
          // Apply wave effect from center
          const dx = x - GRID_SIZE / 2
          const dy = y - GRID_SIZE / 2
          const distFromCenter = Math.sqrt(dx * dx + dy * dy) / GRID_SIZE
          const waveInfluence = Math.sin(timeRef.current * 2 + distFromCenter * 8) * 0.15
          
          // Use enhanced mapping with perceptual curve
          const baseMagnitude = mapFrequencyIndexToEnergy(frame, cellIndex, totalCells, sensitivity * (audioConfig.motionSensitivity || 1.0))
          const elevated = baseMagnitude * (1 + waveInfluence)
          
          const cell = gridRef.current[y][x]
          cell.targetHeight = elevated
          
          // Smooth interpolation
          cell.currentHeight += (cell.targetHeight - cell.currentHeight) * 0.2
          
          // Dynamic color based on position and audio
          const baseHue = 200 + distFromCenter * 100 + timeRef.current * 10
          cell.color = {
            h: (baseHue + baseMagnitude * 140) % 360,
            s: 75 + baseMagnitude * 15,
            l: 35 + baseMagnitude * 30,
          }
        }
      }

      // Render grid with 3D perspective
      ctx.save()
      ctx.translate(width / 2, height * 0.65) // Lower perspective point
      
      // Apply subtle isometric rotation
      const angle = Math.PI / 6 // 30 degrees
      
      // Sort cells back to front for proper 3D rendering
      const renderOrder: Array<{ x: number; y: number }> = []
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          renderOrder.push({ x, y })
        }
      }
      
      // Simple back-to-front sort
      renderOrder.sort((a, b) => {
        const aDepth = a.y * GRID_SIZE + a.x
        const bDepth = b.y * GRID_SIZE + b.x
        return aDepth - bDepth
      })

      // Render each cell
      renderOrder.forEach(({ x, y }) => {
        const cell = gridRef.current[y][x]
        
        // Skip very quiet cells for performance
        if (cell.currentHeight < 0.02) return
        
        // Calculate isometric position
        const isoX = (x - GRID_SIZE / 2) * cellWidth * 0.9
        const isoY = (y - GRID_SIZE / 2) * cellHeight * 0.5
        
        const screenX = isoX * Math.cos(angle) - isoY * Math.sin(angle)
        const screenY = isoX * Math.sin(angle) + isoY * Math.cos(angle)
        
        // Height of the bar
        const barHeight = cell.currentHeight * 120
        
        // Draw shadow
        const shadowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, cellWidth * 0.7)
        shadowGradient.addColorStop(0, `hsla(0, 0%, 0%, ${cell.currentHeight * 0.3})`)
        shadowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = shadowGradient
        ctx.beginPath()
        ctx.arc(screenX, screenY, cellWidth * 0.7 * cell.currentHeight, 0, Math.PI * 2)
        ctx.fill()
        
        // Draw bar top (brightest)
        const topY = screenY - barHeight
        const topGradient = ctx.createRadialGradient(screenX, topY, 0, screenX, topY, cellWidth * 0.4)
        topGradient.addColorStop(0, `hsla(${cell.color.h}, ${cell.color.s}%, ${cell.color.l + 15}%, 0.95)`)
        topGradient.addColorStop(0.7, `hsla(${cell.color.h}, ${cell.color.s}%, ${cell.color.l}%, 0.85)`)
        topGradient.addColorStop(1, `hsla(${cell.color.h}, ${cell.color.s}%, ${cell.color.l - 10}%, 0.6)`)
        
        ctx.fillStyle = topGradient
        ctx.beginPath()
        ctx.arc(screenX, topY, cellWidth * 0.4, 0, Math.PI * 2)
        ctx.fill()
        
        // Draw bar column (gradient from top to bottom)
        const colGradient = ctx.createLinearGradient(screenX, topY, screenX, screenY)
        colGradient.addColorStop(0, `hsla(${cell.color.h}, ${cell.color.s}%, ${cell.color.l}%, 0.9)`)
        colGradient.addColorStop(0.5, `hsla(${cell.color.h}, ${cell.color.s - 10}%, ${cell.color.l - 10}%, 0.8)`)
        colGradient.addColorStop(1, `hsla(${cell.color.h}, ${cell.color.s - 20}%, ${cell.color.l - 20}%, 0.6)`)
        
        ctx.fillStyle = colGradient
        ctx.fillRect(screenX - cellWidth * 0.35, topY, cellWidth * 0.7, barHeight)
        
        // Add glow for high energy cells
        if (cell.currentHeight > 0.5) {
          ctx.shadowBlur = 15 + cell.currentHeight * 20
          ctx.shadowColor = `hsla(${cell.color.h}, 100%, 60%, ${cell.currentHeight * 0.8})`
          ctx.fillStyle = `hsla(${cell.color.h}, 95%, ${cell.color.l + 20}%, ${cell.currentHeight * 0.6})`
          ctx.beginPath()
          ctx.arc(screenX, topY, cellWidth * 0.3, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      ctx.restore()

      // Add grid lines for depth
      ctx.globalAlpha = 0.08
      ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)'
      ctx.lineWidth = 0.5
      
      for (let y = 0; y < GRID_SIZE; y++) {
        ctx.beginPath()
        for (let x = 0; x <= GRID_SIZE; x++) {
          const isoX = (x - GRID_SIZE / 2) * cellWidth * 0.9
          const isoY = (y - GRID_SIZE / 2) * cellHeight * 0.5
          const screenX = width / 2 + isoX * Math.cos(angle) - isoY * Math.sin(angle)
          const screenY = height * 0.65 + isoX * Math.sin(angle) + isoY * Math.cos(angle)
          if (x === 0) ctx.moveTo(screenX, screenY)
          else ctx.lineTo(screenX, screenY)
        }
        ctx.stroke()
      }
      
      for (let x = 0; x < GRID_SIZE; x++) {
        ctx.beginPath()
        for (let y = 0; y <= GRID_SIZE; y++) {
          const isoX = (x - GRID_SIZE / 2) * cellWidth * 0.9
          const isoY = (y - GRID_SIZE / 2) * cellHeight * 0.5
          const screenX = width / 2 + isoX * Math.cos(angle) - isoY * Math.sin(angle)
          const screenY = height * 0.65 + isoX * Math.sin(angle) + isoY * Math.cos(angle)
          if (y === 0) ctx.moveTo(screenX, screenY)
          else ctx.lineTo(screenX, screenY)
        }
        ctx.stroke()
      }
      
      ctx.globalAlpha = 1
    },
    [sensitivity, GRID_SIZE],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/20" />
}

export default AudioGrid

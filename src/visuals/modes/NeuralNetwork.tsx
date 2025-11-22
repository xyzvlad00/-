import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl } from '../utils/colors'

interface FlowLine {
  startX: number
  startY: number
  angle: number
  speed: number
  progress: number
  hue: number
  amplitude: number
  frequency: number
  thickness: number
}

// Minimalistic flowing lines visualization
function NeuralNetwork({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('neural')
  const audioConfig = useAudioMappingConfig('neural')
  const linesRef = useRef<FlowLine[]>([])
  const timeRef = useRef(0)
  
  const MAX_LINES = qualityParams.particleCount || 60

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      timeRef.current += 0.016

      // Clean fade background
      ctx.fillStyle = theme === 'dark' ? 'rgba(2, 4, 10, 0.08)' : 'rgba(245, 247, 252, 0.08)'
      ctx.fillRect(0, 0, width, height)

      // Use normalized energies
      const bassEnergy = frame.bassEnergyNorm * sensitivity * (audioConfig.bassWeight || 1.0)
      const midEnergy = frame.midEnergyNorm * sensitivity * (audioConfig.midWeight || 1.0)
      const highEnergy = frame.highEnergyNorm * sensitivity * (audioConfig.highWeight || 1.0)

      // Create new flowing lines based on audio
      if (linesRef.current.length < MAX_LINES && Math.random() < 0.15 + highEnergy * 0.25) {
        // Diagonal angles for interesting perspective
        const angles = [-0.8, -0.4, 0, 0.4, 0.8, 1.2] // Various angles in radians
        const angle = angles[Math.floor(Math.random() * angles.length)]
        
        // Start from edges
        let startX, startY
        if (Math.abs(angle) < 0.5) {
          // Horizontal-ish: start from left or right
          startX = Math.random() > 0.5 ? -50 : width + 50
          startY = Math.random() * height
        } else {
          // Diagonal: start from corners/edges
          startX = Math.random() * width
          startY = Math.random() > 0.5 ? -50 : height + 50
        }
        
        linesRef.current.push({
          startX,
          startY,
          angle,
          speed: 2 + Math.random() * 3 + midEnergy * 4,
          progress: 0,
          hue: 180 + Math.random() * 120 + bassEnergy * 80,
          amplitude: 20 + Math.random() * 40 + bassEnergy * 30,
          frequency: 0.01 + Math.random() * 0.02,
          thickness: 0.5 + Math.random() * 1.5 + frame.overallVolumeNorm * 2,
        })
      }

      // Update and draw lines
      linesRef.current = linesRef.current.filter((line) => {
        line.progress += line.speed
        
        // Check if line is off screen
        const currentX = line.startX + Math.cos(line.angle) * line.progress
        const currentY = line.startY + Math.sin(line.angle) * line.progress
        
        if (currentX < -100 || currentX > width + 100 || currentY < -100 || currentY > height + 100) {
          return false
        }

        // Draw flowing curved line
        const points: Array<{ x: number; y: number }> = []
        const segments = 50
        const lineLength = 180 + line.amplitude * 2
        
        for (let i = 0; i < segments; i++) {
          const t = i / segments
          const distance = line.progress + t * lineLength
          
          // Base position along angle
          const baseX = line.startX + Math.cos(line.angle) * distance
          const baseY = line.startY + Math.sin(line.angle) * distance
          
          // Wave offset perpendicular to direction
          const waveOffset = Math.sin(distance * line.frequency + timeRef.current * 2) * line.amplitude
          const perpAngle = line.angle + Math.PI / 2
          
          points.push({
            x: baseX + Math.cos(perpAngle) * waveOffset,
            y: baseY + Math.sin(perpAngle) * waveOffset,
          })
        }

        // Draw line with gradient
        if (points.length > 1) {
          // Fade based on lifecycle
          const lifeFade = Math.min(1, line.progress / 100) * Math.max(0, 1 - line.progress / 600)
          
          ctx.beginPath()
          ctx.moveTo(points[0].x, points[0].y)
          
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
          }
          
          // Thin, elegant lines
          const alpha = lifeFade * 0.6
          ctx.strokeStyle = hsl(line.hue, 80, 55, alpha)
          ctx.lineWidth = line.thickness
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.stroke()
          
          // Highlight glow for high-energy segments
          if (frame.overallVolumeNorm > 0.5) {
            ctx.strokeStyle = hsl(line.hue + 30, 90, 65, alpha * 0.4)
            ctx.lineWidth = line.thickness * 1.5
            ctx.shadowBlur = 8 + frame.overallVolumeNorm * 12
            ctx.shadowColor = hsl(line.hue, 100, 60, alpha * 0.5)
            ctx.stroke()
            ctx.shadowBlur = 0
          }
          
          // Draw energy nodes at intervals
          for (let i = 0; i < points.length; i += 10) {
            if (Math.random() < 0.3 + highEnergy * 0.4) {
              const point = points[i]
              const nodeSize = 1 + line.thickness * 0.8 + highEnergy * 3
              
              ctx.fillStyle = hsl(line.hue, 90, 70, lifeFade * 0.8)
              ctx.beginPath()
              ctx.arc(point.x, point.y, nodeSize, 0, Math.PI * 2)
              ctx.fill()
              
              // Bright core
              if (highEnergy > 0.5) {
                ctx.fillStyle = hsl(line.hue, 100, 85, lifeFade)
                ctx.beginPath()
                ctx.arc(point.x, point.y, nodeSize * 0.4, 0, Math.PI * 2)
                ctx.fill()
              }
            }
          }
        }

        return true
      })

      // Connection sparks between nearby lines
      if (linesRef.current.length > 2 && Math.random() < 0.05 + highEnergy * 0.15) {
        for (let i = 0; i < Math.min(3, linesRef.current.length - 1); i++) {
          const line1 = linesRef.current[Math.floor(Math.random() * linesRef.current.length)]
          const line2 = linesRef.current[Math.floor(Math.random() * linesRef.current.length)]
          
          if (line1 === line2) continue
          
          const x1 = line1.startX + Math.cos(line1.angle) * line1.progress
          const y1 = line1.startY + Math.sin(line1.angle) * line1.progress
          const x2 = line2.startX + Math.cos(line2.angle) * line2.progress
          const y2 = line2.startY + Math.sin(line2.angle) * line2.progress
          
          const distance = Math.hypot(x2 - x1, y2 - y1)
          
          if (distance < 150 && distance > 0) {
            ctx.strokeStyle = hsl((line1.hue + line2.hue) / 2, 85, 60, 0.2 * (1 - distance / 150))
            ctx.lineWidth = 0.5
            ctx.setLineDash([2, 4])
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
            ctx.setLineDash([])
          }
        }
      }

      // Subtle ambient particles
      if (Math.random() < 0.3 + midEnergy * 0.4) {
        const x = Math.random() * width
        const y = Math.random() * height
        const size = 1 + Math.random() * 2
        const hue = 200 + Math.random() * 100
        
        ctx.fillStyle = hsl(hue, 70, 60, 0.3)
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    [sensitivity, theme, MAX_LINES],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/40" />
}

export default NeuralNetwork

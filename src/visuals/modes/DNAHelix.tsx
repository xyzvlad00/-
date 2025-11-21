import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// DNA Helix visualization with audio-reactive double helix structure
export function DNAHelix({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      const size = Math.min(width, height)
      timeRef.current += 0.016

      // Background
      ctx.fillStyle = 'rgba(0, 5, 15, 0.15)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Helix parameters
      const helixLength = size * 0.8
      const helixRadius = size * 0.12 + bassEnergy * size * 0.08
      const rotationSpeed = 0.5 + midEnergy * 2
      const segments = 80
      const baseSpacing = helixLength / segments

      // Draw double helix
      for (let strand = 0; strand < 2; strand++) {
        const strandOffset = strand * Math.PI

        for (let i = 0; i < segments; i++) {
          const t = i / segments
          const y = centerY - helixLength / 2 + i * baseSpacing

          // Helix spiral calculation
          const phase = t * Math.PI * 6 + timeRef.current * rotationSpeed + strandOffset
          const x = centerX + Math.cos(phase) * helixRadius
          const z = Math.sin(phase) * helixRadius

          // Depth-based sizing and coloring
          const depth = (z + helixRadius) / (helixRadius * 2)
          const size = 4 + depth * 8 + highEnergy * 6
          const alpha = 0.4 + depth * 0.6

          // Audio-reactive color
          const hue = (t * 180 + timeRef.current * 30 + strand * 180) % 360
          const saturation = 85 + midEnergy * 15
          const lightness = 50 + highEnergy * 30

          // Draw base pair node
          const gradient = createRadialGradient(ctx, x, y, 0, size * 2, [
            { offset: 0, color: hsl(hue, saturation, lightness, alpha * 0.9) },
            { offset: 0.6, color: hsl(hue + 30, saturation, lightness - 10, alpha * 0.6) },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ])

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, size * 2, 0, Math.PI * 2)
          ctx.fill()

          // Core node
          ctx.fillStyle = hsl(hue, 100, 80, alpha)
          ctx.beginPath()
          ctx.arc(x, y, size * 0.5, 0, Math.PI * 2)
          ctx.fill()

          // Connect base pairs between strands
          if (strand === 0 && Math.cos(phase) > 0) {
            const phase2 = t * Math.PI * 6 + timeRef.current * rotationSpeed + Math.PI
            const x2 = centerX + Math.cos(phase2) * helixRadius
            const pairAlpha = 0.3 + bassEnergy * 0.4

            ctx.strokeStyle = hsl(hue, 70, 60, pairAlpha)
            ctx.lineWidth = 1 + bassEnergy * 2
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x2, y)
            ctx.stroke()

            // Connection nodes
            const midX = (x + x2) / 2
            ctx.fillStyle = hsl(hue + 90, 90, 70, pairAlpha * 1.5)
            ctx.beginPath()
            ctx.arc(midX, y, 2 + bassEnergy * 3, 0, Math.PI * 2)
            ctx.fill()
          }

          // Strand connection lines
          if (i > 0) {
            const prevPhase = ((i - 1) / segments) * Math.PI * 6 + timeRef.current * rotationSpeed + strandOffset
            const prevX = centerX + Math.cos(prevPhase) * helixRadius
            const prevY = y - baseSpacing
            const prevZ = Math.sin(prevPhase) * helixRadius
            const prevDepth = (prevZ + helixRadius) / (helixRadius * 2)

            ctx.strokeStyle = hsl(hue - 20, 75, 55, Math.min(depth, prevDepth) * 0.8)
            ctx.lineWidth = 1.5 + midEnergy * 1.5
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(prevX, prevY)
            ctx.lineTo(x, y)
            ctx.stroke()
          }
        }
      }

      // Energy particles flowing through helix
      const particleCount = Math.floor(8 + highEnergy * 12)
      for (let p = 0; p < particleCount; p++) {
        const t = (timeRef.current * 0.3 + p / particleCount) % 1
        const y = centerY - helixLength / 2 + t * helixLength
        const phase = t * Math.PI * 6 + timeRef.current * rotationSpeed
        const x = centerX + Math.cos(phase) * helixRadius * 0.5

        const particleSize = 2 + highEnergy * 4
        const particleHue = (timeRef.current * 100 + p * 40) % 360

        const particleGradient = createRadialGradient(ctx, x, y, 0, particleSize * 3, [
          { offset: 0, color: hsl(particleHue, 100, 80, 0.9) },
          { offset: 0.5, color: hsl(particleHue + 60, 95, 70, 0.5) },
          { offset: 1, color: 'rgba(0,0,0,0)' },
        ])

        ctx.fillStyle = particleGradient
        ctx.beginPath()
        ctx.arc(x, y, particleSize * 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Bass pulse rings
      if (bassEnergy > 0.5) {
        const pulseCount = 3
        for (let r = 0; r < pulseCount; r++) {
          const pulsePhase = (timeRef.current * 2 + r * 0.3) % 1
          const pulseRadius = helixRadius * (0.5 + pulsePhase * 1.5)
          const pulseAlpha = (1 - pulsePhase) * bassEnergy * 0.6

          ctx.strokeStyle = hsl(200, 80, 60, pulseAlpha)
          ctx.lineWidth = 2 + bassEnergy * 3
          ctx.beginPath()
          ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}


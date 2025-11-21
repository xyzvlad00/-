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
          const size = 3 + depth * 6 + highEnergy * 4
          const alpha = 0.5 + depth * 0.4

          // Professional scientific color palette - muted tones
          const baseHue = strand === 0 ? 190 : 280 // Teal and purple for the two strands
          const hue = baseHue + t * 60 + timeRef.current * 15
          const saturation = 45 + midEnergy * 15 // Reduced from 85
          const lightness = 38 + depth * 15 + highEnergy * 12 // Reduced from 50

          // Draw base pair node with subtle gradient
          const gradient = createRadialGradient(ctx, x, y, 0, size * 1.8, [
            { offset: 0, color: hsl(hue, saturation + 10, lightness + 5, alpha * 0.85) },
            { offset: 0.5, color: hsl(hue + 15, saturation, lightness, alpha * 0.65) },
            { offset: 1, color: hsl(hue + 30, saturation - 10, lightness - 8, alpha * 0.2) },
          ])

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, size * 1.8, 0, Math.PI * 2)
          ctx.fill()

          // Subtle core highlight
          if (depth > 0.6) {
            ctx.fillStyle = hsl(hue, saturation + 15, lightness + 20, alpha * 0.7)
            ctx.beginPath()
            ctx.arc(x, y, size * 0.4, 0, Math.PI * 2)
            ctx.fill()
          }

          // Connect base pairs between strands - more realistic
          if (strand === 0 && Math.cos(phase) > 0) {
            const phase2 = t * Math.PI * 6 + timeRef.current * rotationSpeed + Math.PI
            const x2 = centerX + Math.cos(phase2) * helixRadius
            const pairAlpha = 0.25 + bassEnergy * 0.3

            // More subtle connection
            ctx.strokeStyle = hsl((baseHue + baseHue + 280) / 2, 40, 42, pairAlpha)
            ctx.lineWidth = 0.8 + bassEnergy * 1.5
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x2, y)
            ctx.stroke()

            // Subtle connection node
            if (bassEnergy > 0.3) {
              const midX = (x + x2) / 2
              ctx.fillStyle = hsl(220, 50, 50, pairAlpha * 1.2)
              ctx.beginPath()
              ctx.arc(midX, y, 1.5 + bassEnergy * 2, 0, Math.PI * 2)
              ctx.fill()
            }
          }

          // Strand connection lines - more muted
          if (i > 0) {
            const prevPhase = ((i - 1) / segments) * Math.PI * 6 + timeRef.current * rotationSpeed + strandOffset
            const prevX = centerX + Math.cos(prevPhase) * helixRadius
            const prevY = y - baseSpacing
            const prevZ = Math.sin(prevPhase) * helixRadius
            const prevDepth = (prevZ + helixRadius) / (helixRadius * 2)

            const avgDepth = (depth + prevDepth) / 2
            ctx.strokeStyle = hsl(hue, saturation - 10, lightness - 5, avgDepth * 0.7)
            ctx.lineWidth = 1.2 + midEnergy * 1.2
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(prevX, prevY)
            ctx.lineTo(x, y)
            ctx.stroke()
          }
        }
      }

      // Energy particles flowing through helix - more subtle
      if (highEnergy > 0.3) {
        const particleCount = Math.floor(6 + highEnergy * 10)
        for (let p = 0; p < particleCount; p++) {
          const t = (timeRef.current * 0.3 + p / particleCount) % 1
          const y = centerY - helixLength / 2 + t * helixLength
          const phase = t * Math.PI * 6 + timeRef.current * rotationSpeed
          const x = centerX + Math.cos(phase) * helixRadius * 0.5

          const particleSize = 1.5 + highEnergy * 3
          const particleHue = 210 + t * 50 // Blue-cyan range

          const particleGradient = createRadialGradient(ctx, x, y, 0, particleSize * 2.5, [
            { offset: 0, color: hsl(particleHue, 60, 55, 0.8) },
            { offset: 0.5, color: hsl(particleHue + 20, 50, 45, 0.4) },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ])

          ctx.fillStyle = particleGradient
          ctx.beginPath()
          ctx.arc(x, y, particleSize * 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Subtle bass pulse rings
      if (bassEnergy > 0.55) {
        const pulseCount = 2
        for (let r = 0; r < pulseCount; r++) {
          const pulsePhase = (timeRef.current * 1.5 + r * 0.4) % 1
          const pulseRadius = helixRadius * (0.6 + pulsePhase * 1.2)
          const pulseAlpha = (1 - pulsePhase) * bassEnergy * 0.5

          ctx.strokeStyle = hsl(200, 45, 48, pulseAlpha)
          ctx.lineWidth = 1.5 + bassEnergy * 2.5
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


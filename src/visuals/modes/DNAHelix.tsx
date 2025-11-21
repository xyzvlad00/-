import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient, createLinearGradient } from '../utils/colors'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// PROFESSIONAL SCIENTIFIC DNA Helix - Realistic molecular visualization
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

      // Scientific dark background
      const bgGradient = createRadialGradient(ctx, centerX, centerY, 0, size * 0.7, [
        { offset: 0, color: 'rgba(2, 8, 15, 1)' },
        { offset: 0.6, color: 'rgba(0, 5, 12, 1)' },
        { offset: 1, color: 'rgba(0, 2, 8, 1)' },
      ])
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Professional helix parameters
      const helixLength = size * 0.75
      const helixRadius = size * 0.11 + bassEnergy * size * 0.05
      const rotationSpeed = 0.4 + midEnergy * 1.5
      const segments = 100
      const baseSpacing = helixLength / segments

      // Scientific color palette - muted professional colors
      const strand1BaseHue = 195 // Professional cyan
      const strand2BaseHue = 285 // Professional purple

      // Draw backbone ribbons first (behind)
      for (let strand = 0; strand < 2; strand++) {
        const strandOffset = strand * Math.PI
        const baseHue = strand === 0 ? strand1BaseHue : strand2BaseHue

        ctx.beginPath()
        for (let i = 0; i < segments; i++) {
          const t = i / segments
          const y = centerY - helixLength / 2 + i * baseSpacing
          const phase = t * Math.PI * 5 + timeRef.current * rotationSpeed + strandOffset
          const x = centerX + Math.cos(phase) * helixRadius
          // z not needed for backbone ribbon

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        // Professional ribbon appearance
        const depth = 0.6
        ctx.strokeStyle = hsl(baseHue, 35, 32, depth * 0.5)
        ctx.lineWidth = 4 + midEnergy * 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()

        // Inner highlight on ribbon
        ctx.strokeStyle = hsl(baseHue, 40, 38, depth * 0.3)
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw base pairs and nucleotides
      for (let strand = 0; strand < 2; strand++) {
        const strandOffset = strand * Math.PI
        const baseHue = strand === 0 ? strand1BaseHue : strand2BaseHue

        for (let i = 0; i < segments; i++) {
          const t = i / segments
          const y = centerY - helixLength / 2 + i * baseSpacing
          const phase = t * Math.PI * 5 + timeRef.current * rotationSpeed + strandOffset
          const x = centerX + Math.cos(phase) * helixRadius
          const zPos = Math.sin(phase) * helixRadius

          // Depth calculation
          const depth = (zPos + helixRadius) / (helixRadius * 2)
          const size = 2.5 + depth * 4 + highEnergy * 3
          const alpha = 0.6 + depth * 0.3

          // Professional muted colors
          const hue = baseHue + t * 40
          const saturation = 32 + depth * 8 + midEnergy * 10
          const lightness = 35 + depth * 12 + highEnergy * 8

          // Nucleotide sphere with professional appearance
          const gradient = createRadialGradient(ctx, x, y, 0, size * 1.5, [
            { offset: 0, color: hsl(hue, saturation + 8, lightness + 8, alpha * 0.9) },
            { offset: 0.5, color: hsl(hue, saturation, lightness, alpha * 0.7) },
            { offset: 1, color: hsl(hue, saturation - 8, lightness - 10, alpha * 0.3) },
          ])

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, size * 1.5, 0, Math.PI * 2)
          ctx.fill()

          // Subtle specular highlight for realism
          if (depth > 0.65) {
            ctx.fillStyle = hsl(hue, saturation + 20, lightness + 25, alpha * 0.5)
            ctx.beginPath()
            ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2)
            ctx.fill()
          }

          // Core sphere
          if (depth > 0.5) {
            ctx.fillStyle = hsl(hue, saturation + 12, lightness + 5, alpha * 0.8)
            ctx.beginPath()
            ctx.arc(x, y, size * 0.6, 0, Math.PI * 2)
            ctx.fill()
          }

          // Connect base pairs with professional appearance
          if (strand === 0 && Math.cos(phase) > 0) {
            const phase2 = t * Math.PI * 5 + timeRef.current * rotationSpeed + Math.PI
            const x2 = centerX + Math.cos(phase2) * helixRadius
            const z2 = Math.sin(phase2) * helixRadius
            const depth2 = (z2 + helixRadius) / (helixRadius * 2)
            const pairAlpha = Math.min(depth, depth2) * 0.6

            // Base pair connection - realistic molecular bond
            const connectionGradient = createLinearGradient(ctx, x, y, x2, y, [
              { offset: 0, color: hsl(strand1BaseHue, 30, 36, pairAlpha * 0.8) },
              { offset: 0.5, color: hsl((strand1BaseHue + strand2BaseHue) / 2, 28, 32, pairAlpha * 1.0) },
              { offset: 1, color: hsl(strand2BaseHue, 30, 36, pairAlpha * 0.8) },
            ])
            
            ctx.strokeStyle = connectionGradient
            ctx.lineWidth = 1.2 + bassEnergy * 1.8
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x2, y)
            ctx.stroke()

            // Hydrogen bond indicators (small markers)
            if (bassEnergy > 0.25) {
              const bondMarkers = 2
              const bondSpacing = Math.abs(x2 - x) / (bondMarkers + 1)
              
              for (let b = 1; b <= bondMarkers; b++) {
                const bx = Math.min(x, x2) + bondSpacing * b
                ctx.fillStyle = hsl(210, 35, 40, pairAlpha * 1.2)
                ctx.beginPath()
                ctx.arc(bx, y, 1 + bassEnergy * 1.5, 0, Math.PI * 2)
                ctx.fill()
              }
            }
          }

          // Strand connection lines - professional appearance
          if (i > 0) {
            const prevPhase = ((i - 1) / segments) * Math.PI * 5 + timeRef.current * rotationSpeed + strandOffset
            const prevX = centerX + Math.cos(prevPhase) * helixRadius
            const prevY = y - baseSpacing
            const prevZ = Math.sin(prevPhase) * helixRadius
            const prevDepth = (prevZ + helixRadius) / (helixRadius * 2)

            const avgDepth = (depth + prevDepth) / 2
            const connectionHue = baseHue + t * 40
            ctx.strokeStyle = hsl(connectionHue, saturation - 5, lightness - 8, avgDepth * 0.65)
            ctx.lineWidth = 1.8 + midEnergy * 1.2
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(prevX, prevY)
            ctx.lineTo(x, y)
            ctx.stroke()
          }
        }
      }

      // Professional energy indicators (phosphate groups)
      if (highEnergy > 0.35) {
        const indicatorCount = Math.floor(6 + highEnergy * 10)
        for (let p = 0; p < indicatorCount; p++) {
          const t = (timeRef.current * 0.25 + p / indicatorCount) % 1
          const y = centerY - helixLength / 2 + t * helixLength
          const phase = t * Math.PI * 5 + timeRef.current * rotationSpeed
          const x = centerX + Math.cos(phase) * helixRadius * 0.4

          const particleSize = 1.2 + highEnergy * 2.5
          const particleHue = 205 + t * 30

          const particleGradient = createRadialGradient(ctx, x, y, 0, particleSize * 2.5, [
            { offset: 0, color: hsl(particleHue, 45, 52, 0.85) },
            { offset: 0.5, color: hsl(particleHue + 15, 38, 44, 0.5) },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ])

          ctx.fillStyle = particleGradient
          ctx.beginPath()
          ctx.arc(x, y, particleSize * 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Subtle ambient glow
      if (bassEnergy > 0.4) {
        const glowRadius = helixRadius * (1.3 + bassEnergy * 0.5)
        const glowGradient = createRadialGradient(ctx, centerX, centerY, 0, glowRadius, [
          { offset: 0, color: hsl(210, 30, 25, 0.15 * bassEnergy) },
          { offset: 0.5, color: hsl(220, 25, 20, 0.1 * bassEnergy) },
          { offset: 1, color: 'rgba(0,0,0,0)' },
        ])

        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Professional info overlay
      if (frame.beatInfo?.bpm && frame.beatInfo.bpm > 0) {
        ctx.fillStyle = hsl(195, 35, 55, 0.7)
        ctx.font = 'bold 11px system-ui, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${frame.beatInfo.bpm} BPM`, width - 15, height - 15)
        
        ctx.font = '10px system-ui, sans-serif'
        ctx.fillText('DNA Double Helix', width - 15, height - 30)
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

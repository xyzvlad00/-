import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// Clean circular equalizer with defined ring and bars
function RadialSpectrum({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)

  const NUM_BARS = 120 // Smooth circular distribution
  
  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      const baseRadius = Math.min(width, height) * 0.25
      
      timeRef.current += 0.016

      // Clean background
      ctx.fillStyle = theme === 'dark' ? '#000000' : '#FFFFFF'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Main circle line - clean and defined
      const circleRadius = baseRadius + bassEnergy * 15
      ctx.beginPath()
      ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2)
      ctx.strokeStyle = theme === 'dark' 
        ? `hsla(${(timeRef.current * 30) % 360}, 80%, 60%, 0.9)` 
        : `hsla(${(timeRef.current * 30) % 360}, 70%, 45%, 0.9)`
      ctx.lineWidth = 3
      ctx.shadowBlur = 15
      ctx.shadowColor = `hsla(${(timeRef.current * 30) % 360}, 100%, 60%, 0.6)`
      ctx.stroke()

      // Inner glow circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, circleRadius - 8, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${(timeRef.current * 30) % 360}, 90%, 70%, 0.3)`
      ctx.lineWidth = 1
      ctx.stroke()

      // Reset shadow for bars
      ctx.shadowBlur = 0

      // Equalizer bars around the circle
      const angleStep = (Math.PI * 2) / NUM_BARS
      const step = Math.max(1, Math.floor(frame.frequencyData.length / NUM_BARS))

      for (let i = 0; i < NUM_BARS; i++) {
        const angle = i * angleStep
        const freqIndex = Math.min(i * step, frame.frequencyData.length - 1)
        const rawValue = frame.frequencyData[freqIndex] / 255
        
        // Zone-based energy boost
        const freqZone = i / NUM_BARS
        let value: number
        if (freqZone < 0.3) {
          value = rawValue * (1 + bassEnergy * 0.5)
        } else if (freqZone < 0.7) {
          value = rawValue * (1 + midEnergy * 0.4)
        } else {
          value = rawValue * (1 + highEnergy * 0.3)
        }

        // Bar extends outward from circle
        const barLength = value * baseRadius * 0.8
        const startRadius = circleRadius + 5
        const endRadius = startRadius + barLength

        // Calculate positions
        const x1 = centerX + Math.cos(angle) * startRadius
        const y1 = centerY + Math.sin(angle) * startRadius
        const x2 = centerX + Math.cos(angle) * endRadius
        const y2 = centerY + Math.sin(angle) * endRadius

        // Clean color gradient based on position
        const hue = (freqZone * 240 + timeRef.current * 20) % 360
        const alpha = 0.7 + value * 0.3

        // Draw clean bar
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${alpha})`
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.stroke()

        // Add glow to prominent bars
        if (value > 0.4) {
          ctx.shadowBlur = 10 + value * 15
          ctx.shadowColor = `hsla(${hue}, 100%, 65%, ${value * 0.7})`
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${value * 0.8})`
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }

      // Center pulse indicator
      const pulseRadius = 15 + (bassEnergy + midEnergy) * 10
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius)
      gradient.addColorStop(0, `hsla(${(timeRef.current * 30) % 360}, 100%, 70%, 0.8)`)
      gradient.addColorStop(0.7, `hsla(${(timeRef.current * 30) % 360}, 100%, 60%, 0.3)`)
      gradient.addColorStop(1, `hsla(${(timeRef.current * 30) % 360}, 100%, 50%, 0)`)
      ctx.fillStyle = gradient
      ctx.fill()

      // Subtle outer ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius * 1.6, 0, Math.PI * 2)
      ctx.strokeStyle = theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.05)'
      ctx.lineWidth = 1
      ctx.stroke()
    },
    [sensitivity, theme],
  )

  return <canvas ref={canvasRef} className="block h-full w-full" />
}

export default RadialSpectrum

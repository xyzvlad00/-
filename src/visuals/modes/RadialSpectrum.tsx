import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// Professional radial spectrum with layered rings
export function RadialSpectrum({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const pulseWaveRef = useRef<Array<{ radius: number; alpha: number; hue: number }>>([])

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const size = Math.min(width, height)
      const centerX = width / 2
      const centerY = height / 2
      const time = Date.now() * 0.001

      // Deep space background
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.6)
      bgGradient.addColorStop(0, 'rgba(8, 6, 18, 1)')
      bgGradient.addColorStop(0.6, 'rgba(4, 3, 12, 1)')
      bgGradient.addColorStop(1, 'rgba(0, 0, 6, 1)')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Dynamic core with bass response
      const coreRadius = size * 0.08 + frame.overallVolume * 100 * sensitivity + bassEnergy * 50

      rotationRef.current += 0.004 + midEnergy * 0.015

      // Glowing core
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 1.5)
      coreGradient.addColorStop(0, `hsla(${time * 120}, 100%, 80%, 0.9)`)
      coreGradient.addColorStop(0.4, `hsla(${time * 120 + 60}, 95%, 70%, 0.7)`)
      coreGradient.addColorStop(0.7, `hsla(${time * 120 + 120}, 90%, 60%, 0.4)`)
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = coreGradient
      ctx.shadowBlur = 30
      ctx.shadowColor = `hsla(${time * 120}, 100%, 70%, 0.7)`
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRadius * 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Inner ring layers
      for (let layer = 0; layer < 3; layer++) {
        const layerRadius = coreRadius * (1.2 + layer * 0.15)
        const layerAlpha = 0.6 - layer * 0.15
        
        ctx.strokeStyle = `hsla(${time * 120 + layer * 50 + 180}, 85%, 65%, ${layerAlpha})`
        ctx.lineWidth = 2 + (2 - layer)
        ctx.beginPath()
        ctx.arc(centerX, centerY, layerRadius, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Main spectrum bars
      const bars = 180
      const step = Math.max(1, Math.floor(frame.frequencyData.length / bars))

      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 + rotationRef.current
        const freqValue = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255
        
        // Frequency-zone easing
        let easedMag: number
        const freqZone = i / bars
        
        if (freqZone < 0.2) {
          easedMag = Math.pow(freqValue, 0.95) * (1 + bassEnergy * 0.5)
        } else if (freqZone < 0.7) {
          easedMag = Math.pow(freqValue, 1.1) * (1 + midEnergy * 0.35)
        } else {
          easedMag = Math.pow(freqValue, 1.3) * (1 + highEnergy * 0.4)
        }
        
        const barLength = coreRadius + easedMag * size * 0.42 * sensitivity
        const pulse = 1 + frame.overallVolume * 0.25

        const innerX = centerX + Math.cos(angle) * coreRadius * pulse
        const innerY = centerY + Math.sin(angle) * coreRadius * pulse
        const outerX = centerX + Math.cos(angle) * barLength
        const outerY = centerY + Math.sin(angle) * barLength

        // Dynamic coloring
        const hue = (freqZone * 280 + time * 70 + easedMag * 90) % 360
        
        const gradient = ctx.createLinearGradient(innerX, innerY, outerX, outerY)
        gradient.addColorStop(0, `hsla(${hue}, 90%, 60%, ${easedMag * 0.6})`)
        gradient.addColorStop(0.5, `hsla(${hue + 40}, 94%, 68%, ${easedMag * 0.8})`)
        gradient.addColorStop(1, `hsla(${hue + 80}, 97%, 75%, ${easedMag})`)
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = Math.max(1.5, easedMag * 8)
        ctx.lineCap = 'round'
        
        if (easedMag > 0.65) {
          ctx.shadowBlur = 8 + easedMag * 14
          ctx.shadowColor = `hsla(${hue + 60}, 100%, 75%, ${easedMag * 0.6})`
        }
        
        ctx.beginPath()
        ctx.moveTo(innerX, innerY)
        ctx.lineTo(outerX, outerY)
        ctx.stroke()
        
        ctx.shadowBlur = 0
        
        // Energy particles at bar ends
        if (easedMag > 0.75 && i % 6 === 0) {
          const particleGradient = ctx.createRadialGradient(outerX, outerY, 0, outerX, outerY, 8)
          particleGradient.addColorStop(0, `hsla(${hue + 140}, 100%, 88%, ${easedMag})`)
          particleGradient.addColorStop(0.5, `hsla(${hue + 160}, 95%, 78%, ${easedMag * 0.7})`)
          particleGradient.addColorStop(1, 'rgba(0,0,0,0)')
          
          ctx.fillStyle = particleGradient
          ctx.beginPath()
          ctx.arc(outerX, outerY, 8, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Pulse waves on bass hits
      if (bassEnergy > 0.65 && Math.random() > 0.85) {
        pulseWaveRef.current.push({
          radius: coreRadius * 1.2,
          alpha: bassEnergy,
          hue: (time * 130) % 360,
        })
      }

      pulseWaveRef.current = pulseWaveRef.current.filter((wave) => {
        wave.radius += 8
        wave.alpha -= 0.02

        if (wave.alpha > 0 && wave.radius < size * 0.6) {
          ctx.strokeStyle = `hsla(${wave.hue}, 100%, 80%, ${wave.alpha * 0.8})`
          ctx.lineWidth = 3 + wave.alpha * 5
          ctx.shadowBlur = 20
          ctx.shadowColor = ctx.strokeStyle
          ctx.beginPath()
          ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0
          return true
        }
        return false
      })

      // Orbital rings for mid energy
      if (midEnergy > 0.5) {
        for (let ring = 0; ring < 2; ring++) {
          const ringRadius = coreRadius * (2.5 + ring * 0.8) + midEnergy * 40
          const ringAlpha = midEnergy * (0.5 - ring * 0.15)
          
          ctx.strokeStyle = `hsla(${time * 140 + ring * 80}, 90%, 70%, ${ringAlpha})`
          ctx.lineWidth = 2 + midEnergy * 3
          ctx.setLineDash([10, 10])
          ctx.lineDashOffset = -time * 50 - ring * 25
          ctx.beginPath()
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // High energy sparkles
      if (highEnergy > 0.6) {
        const sparkleCount = Math.floor(highEnergy * 12)
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (i / sparkleCount) * Math.PI * 2 + time * 3
          const sparkleRadius = coreRadius * 1.8 + highEnergy * 80
          const x = centerX + Math.cos(angle) * sparkleRadius
          const y = centerY + Math.sin(angle) * sparkleRadius
          
          const sparkleGradient = ctx.createRadialGradient(x, y, 0, x, y, 5)
          sparkleGradient.addColorStop(0, `hsla(${time * 150 + i * 30}, 100%, 95%, ${highEnergy})`)
          sparkleGradient.addColorStop(1, 'rgba(0,0,0,0)')
          
          ctx.fillStyle = sparkleGradient
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/20" />
}

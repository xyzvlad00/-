import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient, createLinearGradient } from '../utils/colors'
import { easeAudio, getFrequencyValue } from '../utils/audio'
import { applyGlow, clearGlow } from '../utils/shapes'
import { EASING_CURVES } from '../constants'

const BANDS = 16
const SEGMENTS_PER_RING = 80 // Reduced for better performance

interface Particle {
  angle: number
  radius: number
  speed: number
  life: number
  hue: number
  size: number
}

function FrequencyRings({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const waveRef = useRef<Array<{ radius: number; alpha: number; width: number }>>([])

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      const size = Math.min(width, height)
      const time = Date.now() * 0.001

      // Deep background
      const bgGradient = createRadialGradient(ctx, centerX, centerY, 0, size * 0.6, [
        { offset: 0, color: 'rgba(10, 8, 20, 1)' },
        { offset: 0.6, color: 'rgba(5, 4, 12, 1)' },
        { offset: 1, color: 'rgba(0, 0, 6, 1)' },
      ])
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Central core
      const coreRadius = 25 + frame.overallVolume * 50 * sensitivity + bassEnergy * 40
      
      const coreGradient = createRadialGradient(ctx, centerX, centerY, 0, coreRadius, [
        { offset: 0, color: hsl(time * 100, 95, 75, 0.9) },
        { offset: 0.5, color: hsl(time * 100 + 60, 90, 65, 0.7) },
        { offset: 1, color: hsl(time * 100 + 120, 85, 55, 0.3) },
      ])
      
      applyGlow(ctx, hsl(time * 100, 90, 70, 0.6), 25)
      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2)
      ctx.fill()
      clearGlow(ctx)

      // Core pulse ring
      if (frame.overallVolume > 0.4) {
        const pulseColor = hsl(time * 110 + 180, 100, 80, frame.overallVolume * 0.7)
        ctx.strokeStyle = pulseColor
        ctx.lineWidth = 3 + frame.overallVolume * 4
        applyGlow(ctx, pulseColor, 18)
        ctx.beginPath()
        ctx.arc(centerX, centerY, coreRadius * 1.2, 0, Math.PI * 2)
        ctx.stroke()
        clearGlow(ctx)
      }

      // Main frequency rings
      const step = Math.max(1, Math.floor(frame.frequencyData.length / BANDS))
      const baseRadius = coreRadius * 1.8
      const ringSpacing = (size * 0.42) / BANDS

      for (let band = 0; band < BANDS; band++) {
        const freqValue = getFrequencyValue(frame.frequencyData, band * step)
        const bandRatio = band / BANDS
        
        // Zone-specific easing
        let easedMag: number
        if (bandRatio < 0.25) {
          easedMag = easeAudio(freqValue, 0.9) * (1 + bassEnergy * 0.6)
        } else if (bandRatio < 0.7) {
          easedMag = easeAudio(freqValue, 1.1) * (1 + midEnergy * 0.45)
        } else {
          easedMag = easeAudio(freqValue, 1.3) * (1 + highEnergy * 0.5)
        }

        const ringRadius = baseRadius + band * ringSpacing
        const hue = (bandRatio * 320 + time * 60 + easedMag * 80) % 360
        const angleOffset = time * (0.3 + band * 0.05) + easedMag * Math.PI

        // Draw segmented ring
        for (let seg = 0; seg < SEGMENTS_PER_RING; seg++) {
          const segRatio = seg / SEGMENTS_PER_RING
          const angle = segRatio * Math.PI * 2 + angleOffset
          
          // Wave distortion
          const wave = Math.sin(angle * 4 + time * 2 + band * 0.5) * easedMag * 12
          const distortedRadius = ringRadius + wave
          
          const segmentLength = (Math.PI * 2 * distortedRadius) / SEGMENTS_PER_RING * 0.8
          
          const x1 = centerX + Math.cos(angle) * distortedRadius
          const y1 = centerY + Math.sin(angle) * distortedRadius
          const x2 = centerX + Math.cos(angle + segmentLength / distortedRadius) * distortedRadius
          const y2 = centerY + Math.sin(angle + segmentLength / distortedRadius) * distortedRadius
          
          const segmentAlpha = (0.3 + easedMag * 0.7) * (1 - bandRatio * 0.3)
          
          if (segmentAlpha < 0.15) continue
          
          const gradient = createLinearGradient(ctx, x1, y1, x2, y2, [
            { offset: 0, color: hsl(hue, 88, 62, segmentAlpha * 0.6) },
            { offset: 0.5, color: hsl(hue + 40, 92, 70, segmentAlpha) },
            { offset: 1, color: hsl(hue, 88, 62, segmentAlpha * 0.6) },
          ])
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = 1.5 + easedMag * 4 * (1 - bandRatio * 0.4)
          ctx.lineCap = 'round'
          
          if (easedMag > 0.7) {
            applyGlow(ctx, hsl(hue + 60, 100, 75, easedMag * 0.5), 10)
          }
          
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
          
          clearGlow(ctx)
        }

        // Connecting ring for high energy bands
        if (easedMag > 0.6 && band % 3 === 0) {
          ctx.strokeStyle = hsl(hue + 120, 90, 68, easedMag * 0.4)
          ctx.lineWidth = 1 + easedMag * 2
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Spawn particles on high energy
        if (easedMag > 0.75 && Math.random() > 0.9) {
          const particleAngle = Math.random() * Math.PI * 2
          particlesRef.current.push({
            angle: particleAngle,
            radius: ringRadius,
            speed: 2 + easedMag * 4,
            life: 1,
            hue: hue,
            size: 2 + easedMag * 4,
          })
        }
      }

      // Particle system
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.radius += particle.speed
        particle.life -= 0.015
        particle.angle += 0.02

        if (particle.life > 0 && particle.radius < size * 0.55) {
          const x = centerX + Math.cos(particle.angle) * particle.radius
          const y = centerY + Math.sin(particle.angle) * particle.radius
          
          const particleGradient = createRadialGradient(ctx, x, y, 0, particle.size * 2, [
            { offset: 0, color: hsl(particle.hue + 140, 100, 85, particle.life * 0.9) },
            { offset: 0.6, color: hsl(particle.hue + 180, 95, 75, particle.life * 0.6) },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ])
          
          ctx.fillStyle = particleGradient
          ctx.beginPath()
          ctx.arc(x, y, particle.size * 2, 0, Math.PI * 2)
          ctx.fill()
          
          return true
        }
        return false
      })

      // Limit particles
      if (particlesRef.current.length > 300) {
        particlesRef.current = particlesRef.current.slice(-300)
      }

      // Bass wave system
      if (bassEnergy > 0.65 && Math.random() > 0.88) {
        waveRef.current.push({
          radius: coreRadius * 1.3,
          alpha: bassEnergy * 0.8,
          width: 3 + bassEnergy * 8,
        })
      }

      waveRef.current = waveRef.current.filter((wave) => {
        wave.radius += 6
        wave.alpha -= 0.02

        if (wave.alpha > 0 && wave.radius < size * 0.5) {
          ctx.strokeStyle = `hsla(${time * 120 + 200}, 100%, 75%, ${wave.alpha})`
          ctx.lineWidth = wave.width
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

      // Star burst on high energy
      if (highEnergy > 0.7) {
        const rayCount = 16
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + time * 1.5
          const rayLength = coreRadius * 1.5 + highEnergy * 80
          const innerX = centerX + Math.cos(angle) * coreRadius * 1.1
          const innerY = centerY + Math.sin(angle) * coreRadius * 1.1
          const outerX = centerX + Math.cos(angle) * rayLength
          const outerY = centerY + Math.sin(angle) * rayLength
          
          const rayGradient = ctx.createLinearGradient(innerX, innerY, outerX, outerY)
          rayGradient.addColorStop(0, `hsla(${time * 130 + i * 25}, 100%, 85%, ${highEnergy * 0.7})`)
          rayGradient.addColorStop(0.6, `hsla(${time * 130 + i * 25 + 60}, 95%, 75%, ${highEnergy * 0.4})`)
          rayGradient.addColorStop(1, 'rgba(0,0,0,0)')
          
          ctx.strokeStyle = rayGradient
          ctx.lineWidth = 1.5 + highEnergy * 3
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(innerX, innerY)
          ctx.lineTo(outerX, outerY)
          ctx.stroke()
        }
      }

      // Orbital sparkles
      if (midEnergy > 0.6) {
        const sparkleCount = Math.floor(midEnergy * 10)
        const orbitRadius = baseRadius + BANDS * ringSpacing * 0.5
        
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (i / sparkleCount) * Math.PI * 2 + time * 2
          const x = centerX + Math.cos(angle) * orbitRadius
          const y = centerY + Math.sin(angle) * orbitRadius
          
          ctx.fillStyle = `hsla(${time * 140 + i * 35}, 100%, 90%, ${midEnergy})`
          ctx.shadowBlur = 10
          ctx.shadowColor = ctx.fillStyle
          ctx.beginPath()
          ctx.arc(x, y, 2 + midEnergy * 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

export default FrequencyRings

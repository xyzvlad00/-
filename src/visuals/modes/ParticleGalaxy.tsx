import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { createRadialGradient } from '../utils/colors'
import { easeAudio } from '../utils/audio'

// Flowing particle streams with natural motion
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  hue: number
  size: number
  depth: number
  trail: Array<{ x: number; y: number; alpha: number }>
}

const PARTICLE_COUNT = 1200

export function ParticleGalaxy({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const timeRef = useRef(0)

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      const size = Math.min(width, height)
      timeRef.current += 0.016

      // Deep space background with gradient
      const bgGradient = createRadialGradient(ctx, centerX, centerY, 0, size * 0.7, [
        { offset: 0, color: 'rgba(12, 8, 25, 1)' },
        { offset: 0.5, color: 'rgba(6, 4, 15, 1)' },
        { offset: 1, color: 'rgba(0, 0, 8, 1)' },
      ])
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, 0.65) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, 0.75) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, 0.85) * sensitivity

      // Initialize particles
      if (particlesRef.current.length === 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * size * 0.5
          const depth = Math.pow(Math.random(), 0.7)
          
          particlesRef.current.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: Math.random(),
            maxLife: 0.5 + Math.random() * 0.5,
            hue: Math.random() * 360,
            size: 1 + Math.random() * 2,
            depth: depth,
            trail: [],
          })
        }
      }

      // Sort particles by depth for proper rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => a.depth - b.depth)

      // Update and render particles
      sortedParticles.forEach((particle, idx) => {
        // Sample frequency based on particle index
        const freqIndex = Math.floor((idx / PARTICLE_COUNT) * frame.frequencyData.length * 0.85)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const audioBoost = 1 + magnitude * sensitivity * 0.8

        // Position relative to center
        const dx = particle.x - centerX
        const dy = particle.y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)

        // Natural flow forces
        // 1. Spiral motion
        const spiralAngle = angle + 0.02 + midEnergy * 0.03
        const spiralForce = 0.15 + magnitude * 0.2
        particle.vx += Math.cos(spiralAngle) * spiralForce * particle.depth
        particle.vy += Math.sin(spiralAngle) * spiralForce * particle.depth

        // 2. Attraction/repulsion from center based on audio
        if (dist > 10) {
          const centerForce = (bassEnergy * 0.3 - 0.1) * (1 - particle.depth * 0.5)
          particle.vx += (dx / dist) * centerForce
          particle.vy += (dy / dist) * centerForce
        }

        // 3. Turbulence from high frequencies
        if (highEnergy > 0.4) {
          particle.vx += (Math.random() - 0.5) * highEnergy * 1.5
          particle.vy += (Math.random() - 0.5) * highEnergy * 1.5
        }

        // 4. Wave field influence
        const waveX = Math.sin(particle.y * 0.01 + timeRef.current * 0.5) * 0.3
        const waveY = Math.cos(particle.x * 0.01 + timeRef.current * 0.5) * 0.3
        particle.vx += waveX * midEnergy
        particle.vy += waveY * midEnergy

        // Update position
        particle.x += particle.vx * audioBoost
        particle.y += particle.vy * audioBoost

        // Friction
        particle.vx *= 0.985
        particle.vy *= 0.985

        // Wrap around screen
        const margin = 50
        if (particle.x < -margin) particle.x = width + margin
        if (particle.x > width + margin) particle.x = -margin
        if (particle.y < -margin) particle.y = height + margin
        if (particle.y > height + margin) particle.y = -margin

        // Update trail
        particle.trail.unshift({ x: particle.x, y: particle.y, alpha: 1 })
        if (particle.trail.length > 15) {
          particle.trail = particle.trail.slice(0, 15)
        }
        particle.trail.forEach((point, i) => {
          point.alpha = 1 - (i / particle.trail.length)
        })

        // Update life and hue
        particle.life = (particle.life + 0.002) % 1
        particle.hue = (particle.hue + magnitude * 0.5 + 0.1) % 360

        // Render trail
        if (particle.trail.length > 1) {
          const trailBrightness = magnitude * particle.depth
          for (let t = 0; t < particle.trail.length - 1; t++) {
            const p1 = particle.trail[t]
            const p2 = particle.trail[t + 1]
            const trailAlpha = p1.alpha * trailBrightness * 0.5

            if (trailAlpha < 0.05) continue

            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
            gradient.addColorStop(0, `hsla(${particle.hue}, 85%, 65%, ${trailAlpha})`)
            gradient.addColorStop(1, `hsla(${particle.hue + 30}, 80%, 60%, ${trailAlpha * 0.7})`)

            ctx.strokeStyle = gradient
            ctx.lineWidth = particle.size * particle.depth * (1 + magnitude * 0.5)
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }

        // Render particle
        const particleAlpha = magnitude * particle.depth * (0.7 + particle.life * 0.3)
        if (particleAlpha > 0.1) {
          const renderSize = particle.size * particle.depth * (1 + magnitude * 0.8) * audioBoost
          const glowSize = renderSize * 3

          const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, glowSize)
          gradient.addColorStop(0, `hsla(${particle.hue}, 95%, 75%, ${particleAlpha})`)
          gradient.addColorStop(0.5, `hsla(${particle.hue + 40}, 90%, 65%, ${particleAlpha * 0.6})`)
          gradient.addColorStop(1, 'rgba(0,0,0,0)')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2)
          ctx.fill()

          // Bright core
          if (magnitude > 0.6 && particle.depth > 0.5) {
            ctx.fillStyle = `hsla(${particle.hue + 80}, 100%, 90%, ${particleAlpha})`
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, renderSize * 0.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

      // Central energy core
      if (frame.overallVolume > 0.3) {
        const coreSize = 40 + bassEnergy * 150
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize)
        coreGradient.addColorStop(0, `hsla(${timeRef.current * 100}, 100%, 80%, ${frame.overallVolume * 0.8})`)
        coreGradient.addColorStop(0.4, `hsla(${timeRef.current * 100 + 60}, 95%, 70%, ${frame.overallVolume * 0.6})`)
        coreGradient.addColorStop(0.7, `hsla(${timeRef.current * 100 + 120}, 90%, 60%, ${frame.overallVolume * 0.4})`)
        coreGradient.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.fillStyle = coreGradient
        ctx.shadowBlur = 30
        ctx.shadowColor = `hsla(${timeRef.current * 100}, 90%, 70%, 0.7)`
        ctx.beginPath()
        ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Energy rings on bass hits
        if (bassEnergy > 0.7) {
          for (let ring = 0; ring < 3; ring++) {
            const ringRadius = coreSize * (1.3 + ring * 0.4)
            const ringAlpha = bassEnergy * (0.7 - ring * 0.2)

            ctx.strokeStyle = `hsla(${timeRef.current * 110 + ring * 60}, 100%, 75%, ${ringAlpha})`
            ctx.lineWidth = 2 + bassEnergy * 4
            ctx.shadowBlur = 15
            ctx.shadowColor = ctx.strokeStyle
            ctx.beginPath()
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
            ctx.stroke()
            ctx.shadowBlur = 0
          }
        }
      }

      // Flow field visualization lines
      if (midEnergy > 0.5) {
        const flowLines = 12
        ctx.strokeStyle = `hsla(${timeRef.current * 90 + 180}, 80%, 60%, ${midEnergy * 0.2})`
        ctx.lineWidth = 1
        ctx.setLineDash([5, 10])

        for (let i = 0; i < flowLines; i++) {
          const angle = (i / flowLines) * Math.PI * 2 + timeRef.current * 0.5
          const innerR = size * 0.15
          const outerR = size * 0.45

          ctx.beginPath()
          for (let r = innerR; r < outerR; r += 20) {
            const spiralAngle = angle + (r / outerR) * Math.PI * 2
            const x = centerX + Math.cos(spiralAngle) * r
            const y = centerY + Math.sin(spiralAngle) * r
            if (r === innerR) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        ctx.setLineDash([])
      }

      // Nebula clouds (large soft glows)
      if (highEnergy > 0.4) {
        const cloudCount = 5
        for (let c = 0; c < cloudCount; c++) {
          const angle = (c / cloudCount) * Math.PI * 2 + timeRef.current * 0.3
          const distance = size * 0.25 + Math.sin(timeRef.current + c) * size * 0.1
          const cloudX = centerX + Math.cos(angle) * distance
          const cloudY = centerY + Math.sin(angle) * distance
          const cloudSize = 80 + highEnergy * 100

          const cloudGradient = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cloudSize)
          cloudGradient.addColorStop(0, `hsla(${c * 60 + timeRef.current * 80}, 70%, 50%, ${highEnergy * 0.25})`)
          cloudGradient.addColorStop(0.5, `hsla(${c * 60 + timeRef.current * 80 + 40}, 65%, 45%, ${highEnergy * 0.15})`)
          cloudGradient.addColorStop(1, 'rgba(0,0,0,0)')

          ctx.fillStyle = cloudGradient
          ctx.beginPath()
          ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

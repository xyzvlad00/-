import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

interface Particle {
  angle: number
  angleVelocity: number
  targetRadius: number
  currentRadius: number
  radiusVelocity: number
  z: number // Depth (0 = far, 1 = near)
  zVelocity: number
  targetZ: number
  size: number
  hue: number
  orbitSpeed: number
  elasticity: number // Spring constant
  damping: number // Friction
  life: number
  trail: Array<{ x: number; y: number; alpha: number }>
}

const PARTICLE_COUNT = 200 // Reduced for better performance with trails
const TRAIL_LENGTH = 8

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const initialRadius = 60 + Math.random() * 320
    return {
      angle: Math.random() * Math.PI * 2,
      angleVelocity: (Math.random() - 0.5) * 0.02,
      targetRadius: initialRadius,
      currentRadius: initialRadius,
      radiusVelocity: 0,
      z: Math.random(),
      zVelocity: 0,
      targetZ: Math.random(),
      size: 2 + Math.random() * 5,
      hue: 160 + Math.random() * 140,
      orbitSpeed: 0.002 + Math.random() * 0.01,
      elasticity: 0.12 + Math.random() * 0.18, // Stronger spring
      damping: 0.80 + Math.random() * 0.12, // More bounce
      life: Math.random(),
      trail: [],
    }
  })
}

function OrbitalParticles({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>(createParticles())
  const timeRef = useRef(0)

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.min(width, height) * 0.45
      timeRef.current += 0.016

      // Deep space background with radial gradient
      const bgGradient = createRadialGradient(ctx, centerX, centerY, 0, Math.max(width, height), [
        { offset: 0, color: theme === 'dark' ? 'rgba(5, 8, 20, 1)' : 'rgba(255, 255, 255, 1)' },
        { offset: 0.5, color: theme === 'dark' ? 'rgba(2, 4, 12, 1)' : 'rgba(248, 250, 252, 1)' },
        { offset: 1, color: theme === 'dark' ? 'rgba(0, 0, 5, 1)' : 'rgba(241, 245, 249, 1)' },
      ])
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Fade effect for trails
      ctx.fillStyle = theme === 'dark' ? 'rgba(0, 0, 5, 0.15)' : 'rgba(255, 255, 255, 0.15)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Sort particles by depth for proper rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => a.z - b.z)

      sortedParticles.forEach((particle, index) => {
        // Update life cycle
        particle.life += 0.003
        particle.hue = (particle.hue + 0.2) % 360

        // ENHANCED elastic spring physics for radius
        const radiusTarget = particle.targetRadius * (1 + bassEnergy * 0.8)
        const radiusForce = (radiusTarget - particle.currentRadius) * particle.elasticity
        particle.radiusVelocity += radiusForce
        particle.radiusVelocity *= particle.damping // Apply damping
        particle.currentRadius += particle.radiusVelocity

        // ENHANCED elastic spring physics for depth (z) with wave motion
        const waveDepth = Math.sin(timeRef.current * 0.8 + index * 0.15) * 0.4 * midEnergy
        const depthPulse = Math.sin(timeRef.current * 2 + particle.angle * 3) * 0.2 * highEnergy
        const zTarget = particle.targetZ + waveDepth + depthPulse
        const zForce = (zTarget - particle.z) * (particle.elasticity * 0.7)
        particle.zVelocity += zForce
        particle.zVelocity *= particle.damping
        particle.z += particle.zVelocity
        particle.z = Math.max(0, Math.min(1, particle.z)) // Clamp z to [0, 1]

        // Update orbital angle with high energy influence
        particle.angleVelocity += (Math.random() - 0.5) * highEnergy * 0.003
        particle.angleVelocity *= 0.92 // Less damping = more momentum
        particle.angle += particle.orbitSpeed + particle.angleVelocity + midEnergy * 0.015

        // Randomize target radius for dynamic movement
        if (Math.random() > 0.985) {
          particle.targetRadius = 60 + Math.random() * (maxRadius - 60)
        }

        // Randomize target depth occasionally
        if (Math.random() > 0.985) {
          particle.targetZ = Math.random()
        }

        // Calculate 2D position with ENHANCED depth perspective
        const depthScale = 0.3 + particle.z * 0.7 // More dramatic depth difference
        const perspectiveRadius = particle.currentRadius * depthScale
        const x = centerX + Math.cos(particle.angle) * perspectiveRadius
        const y = centerY + Math.sin(particle.angle) * perspectiveRadius

        // Add to trail
        particle.trail.push({ x, y, alpha: 1 })
        if (particle.trail.length > TRAIL_LENGTH) {
          particle.trail.shift()
        }

        // Draw trails
        particle.trail.forEach((point, trailIndex) => {
          const trailAlpha = (trailIndex / particle.trail.length) * (0.3 + particle.z * 0.4)
          const trailSize = particle.size * depthScale * (trailIndex / particle.trail.length) * 0.5
          
          ctx.fillStyle = hsl(particle.hue, 90, 70, trailAlpha * 0.4)
          ctx.beginPath()
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2)
          ctx.fill()
        })

        // ENHANCED depth-based size, opacity, and brightness
        const depthBrightness = 0.2 + particle.z * 0.8 // More contrast
        const renderSize = particle.size * depthScale * (1 + highEnergy * 0.6)
        const alpha = depthBrightness * (0.5 + Math.sin(particle.life) * 0.3)

        // Draw elastic connections to nearby particles
        const connectionRange = 100 + bassEnergy * 50
        sortedParticles.forEach((other, otherIndex) => {
          if (otherIndex <= index) return // Avoid duplicate connections
          if (Math.abs(particle.z - other.z) > 0.25) return // Only connect particles at similar depth

          const otherDepthScale = 0.3 + other.z * 0.7
          const otherX = centerX + Math.cos(other.angle) * (other.currentRadius * otherDepthScale)
          const otherY = centerY + Math.sin(other.angle) * (other.currentRadius * otherDepthScale)

          const dx = otherX - x
          const dy = otherY - y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionRange) {
            const connectionAlpha = (1 - dist / connectionRange) * alpha * (0.2 + other.z * 0.6) * 0.6
            if (connectionAlpha < 0.04) return

            // Elastic connection with depth-based thickness
            const connectionHue = (particle.hue + other.hue) / 2
            const avgDepth = (particle.z + other.z) / 2
            ctx.strokeStyle = hsl(connectionHue, 85, 65 + midEnergy * 15, connectionAlpha)
            ctx.lineWidth = (0.5 + avgDepth * 2) * (1 + bassEnergy * 0.5)
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(otherX, otherY)
            ctx.stroke()
          }
        })

        // Render particle with ENHANCED glow and depth
        const glowSize = renderSize * (3 + particle.z * 2) // Bigger glow for near particles
        const gradient = createRadialGradient(ctx, x, y, 0, glowSize, [
          { offset: 0, color: hsl(particle.hue, 100, 90, alpha * 1.3) },
          { offset: 0.3, color: hsl(particle.hue + 20, 95, 80, alpha * 0.9) },
          { offset: 0.6, color: hsl(particle.hue + 40, 90, 70, alpha * 0.5) },
          { offset: 0.8, color: hsl(particle.hue + 60, 85, 60, alpha * 0.2) },
          { offset: 1, color: hsl(particle.hue + 80, 80, 50, 0) },
        ])

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, glowSize, 0, Math.PI * 2)
        ctx.fill()

        // ENHANCED bright core for near particles with pulsing
        if (particle.z > 0.6) {
          const corePulse = 1 + Math.sin(particle.life * 3) * 0.3
          ctx.shadowBlur = 15 + particle.z * 20
          ctx.shadowColor = hsl(particle.hue, 100, 80, alpha)
          ctx.fillStyle = hsl(particle.hue, 100, 95, alpha * corePulse)
          ctx.beginPath()
          ctx.arc(x, y, renderSize * 1.2 * corePulse, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      // ENHANCED central attractor with depth pulsing
      const attractorRadius = 50 + bassEnergy * 100 + Math.sin(timeRef.current * 3) * 30
      const attractorGradient = createRadialGradient(ctx, centerX, centerY, 0, attractorRadius * 1.5, [
        { offset: 0, color: hsl(timeRef.current * 80 + 200, 100, 95, 0.9) },
        { offset: 0.2, color: hsl(timeRef.current * 80 + 230, 100, 90, 0.8) },
        { offset: 0.4, color: hsl(timeRef.current * 80 + 260, 95, 80, 0.6) },
        { offset: 0.7, color: hsl(timeRef.current * 80 + 290, 90, 70, 0.3) },
        { offset: 1, color: hsl(timeRef.current * 80 + 320, 85, 60, 0) },
      ])

      ctx.fillStyle = attractorGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, attractorRadius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Inner core
      ctx.fillStyle = hsl(timeRef.current * 80 + 200, 100, 98, 0.8 + bassEnergy * 0.2)
      ctx.shadowBlur = 30 + bassEnergy * 40
      ctx.shadowColor = hsl(timeRef.current * 80 + 200, 100, 90, 0.9)
      ctx.beginPath()
      ctx.arc(centerX, centerY, 20 + bassEnergy * 30, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Orbital rings with depth
      for (let ring = 0; ring < 4; ring++) {
        const ringDepth = (ring + 1) / 4
        const ringRadius = 80 + ring * 100 + bassEnergy * 50 * ringDepth
        const ringAlpha = (0.3 - ring * 0.06) * (1 + midEnergy * 0.5)
        
        ctx.strokeStyle = hsl(timeRef.current * 60 + ring * 45 + 220, 90, 70, ringAlpha)
        ctx.lineWidth = (1 + ring * 0.4) * (1 + ringDepth * 0.5)
        ctx.setLineDash([8, 20])
        ctx.lineDashOffset = -timeRef.current * 40 * (1 + ring * 0.6)
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    },
    [sensitivity, theme],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/20" />
}

export default OrbitalParticles

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
}

const PARTICLE_COUNT = 250

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const initialRadius = 80 + Math.random() * 300
    return {
      angle: Math.random() * Math.PI * 2,
      angleVelocity: (Math.random() - 0.5) * 0.01,
      targetRadius: initialRadius,
      currentRadius: initialRadius,
      radiusVelocity: 0,
      z: Math.random(),
      zVelocity: 0,
      targetZ: Math.random(),
      size: 2 + Math.random() * 4,
      hue: 160 + Math.random() * 140,
      orbitSpeed: 0.003 + Math.random() * 0.008,
      elasticity: 0.08 + Math.random() * 0.12, // Spring force
      damping: 0.85 + Math.random() * 0.1, // Energy loss
      life: Math.random(),
    }
  })
}

export function OrbitalParticles({ sensitivity }: VisualComponentProps) {
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

      // Deep space background
      ctx.fillStyle = 'rgba(2, 3, 8, 0.25)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Sort particles by depth for proper rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => a.z - b.z)

      sortedParticles.forEach((particle, index) => {
        // Update life cycle
        particle.life += 0.002
        particle.hue = (particle.hue + 0.15) % 360

        // Elastic spring physics for radius
        const radiusTarget = particle.targetRadius * (1 + bassEnergy * 0.6)
        const radiusForce = (radiusTarget - particle.currentRadius) * particle.elasticity
        particle.radiusVelocity += radiusForce
        particle.radiusVelocity *= particle.damping // Apply damping
        particle.currentRadius += particle.radiusVelocity

        // Elastic spring physics for depth (z)
        const zTarget = particle.targetZ + Math.sin(timeRef.current * 0.5 + index * 0.1) * 0.3 * midEnergy
        const zForce = (zTarget - particle.z) * (particle.elasticity * 0.5)
        particle.zVelocity += zForce
        particle.zVelocity *= particle.damping
        particle.z += particle.zVelocity
        particle.z = Math.max(0, Math.min(1, particle.z)) // Clamp z to [0, 1]

        // Update orbital angle with high energy influence
        particle.angleVelocity += (Math.random() - 0.5) * highEnergy * 0.002
        particle.angleVelocity *= 0.95 // Damping
        particle.angle += particle.orbitSpeed + particle.angleVelocity + midEnergy * 0.01

        // Randomize target radius occasionally for dynamic movement
        if (Math.random() > 0.98) {
          particle.targetRadius = 80 + Math.random() * (maxRadius - 80)
        }

        // Randomize target depth occasionally
        if (Math.random() > 0.98) {
          particle.targetZ = Math.random()
        }

        // Calculate 2D position with depth perspective
        const depthScale = 0.4 + particle.z * 0.6 // Particles far away appear smaller
        const perspectiveRadius = particle.currentRadius * depthScale
        const x = centerX + Math.cos(particle.angle) * perspectiveRadius
        const y = centerY + Math.sin(particle.angle) * perspectiveRadius

        // Depth-based size and opacity
        const depthBrightness = 0.3 + particle.z * 0.7
        const renderSize = particle.size * depthScale * (1 + highEnergy * 0.5)
        const alpha = depthBrightness * (0.4 + Math.sin(particle.life) * 0.3)

        // Draw elastic connections to nearby particles
        const connectionRange = 120
        sortedParticles.forEach((other, otherIndex) => {
          if (otherIndex <= index) return // Avoid duplicate connections
          if (Math.abs(particle.z - other.z) > 0.3) return // Only connect particles at similar depth

          const otherDepthScale = 0.4 + other.z * 0.6
          const otherX = centerX + Math.cos(other.angle) * (other.currentRadius * otherDepthScale)
          const otherY = centerY + Math.sin(other.angle) * (other.currentRadius * otherDepthScale)

          const dx = otherX - x
          const dy = otherY - y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionRange) {
            const connectionAlpha = (1 - dist / connectionRange) * alpha * (0.3 + other.z * 0.7) * 0.5
            if (connectionAlpha < 0.05) return

            // Elastic connection appearance
            const connectionHue = (particle.hue + other.hue) / 2
            ctx.strokeStyle = hsl(connectionHue, 80, 60 + midEnergy * 20, connectionAlpha)
            ctx.lineWidth = 0.5 + connectionAlpha * 2
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(otherX, otherY)
            ctx.stroke()
          }
        })

        // Render particle with glow
        const gradient = createRadialGradient(ctx, x, y, 0, renderSize * 3, [
          { offset: 0, color: hsl(particle.hue, 100, 85, alpha * 1.2) },
          { offset: 0.4, color: hsl(particle.hue + 30, 95, 75, alpha * 0.8) },
          { offset: 0.7, color: hsl(particle.hue + 60, 90, 65, alpha * 0.4) },
          { offset: 1, color: hsl(particle.hue + 90, 85, 55, 0) },
        ])

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, renderSize * 3, 0, Math.PI * 2)
        ctx.fill()

        // Bright core for near particles
        if (particle.z > 0.7) {
          ctx.fillStyle = hsl(particle.hue, 100, 95, alpha)
          ctx.beginPath()
          ctx.arc(x, y, renderSize * 0.8, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Central attractor glow
      const attractorRadius = 40 + bassEnergy * 80 + Math.sin(timeRef.current * 2) * 20
      const attractorGradient = createRadialGradient(ctx, centerX, centerY, 0, attractorRadius, [
        { offset: 0, color: hsl(timeRef.current * 60 + 180, 100, 90, 0.8) },
        { offset: 0.3, color: hsl(timeRef.current * 60 + 220, 95, 80, 0.6) },
        { offset: 0.6, color: hsl(timeRef.current * 60 + 260, 90, 70, 0.3) },
        { offset: 1, color: hsl(timeRef.current * 60 + 300, 85, 60, 0) },
      ])

      ctx.fillStyle = attractorGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, attractorRadius, 0, Math.PI * 2)
      ctx.fill()

      // Orbital rings
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = 100 + ring * 120 + bassEnergy * 40
        const ringAlpha = (0.25 - ring * 0.07) * (1 + midEnergy * 0.4)
        
        ctx.strokeStyle = hsl(timeRef.current * 50 + ring * 60 + 200, 85, 65, ringAlpha)
        ctx.lineWidth = 1 + ring * 0.5
        ctx.setLineDash([5, 15])
        ctx.lineDashOffset = -timeRef.current * 30 * (1 + ring * 0.5)
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/10" />
}


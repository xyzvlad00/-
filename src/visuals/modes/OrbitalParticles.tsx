import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'

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

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => {
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
      size: 3 + Math.random() * 8, // Bigger particles
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
  const qualityParams = useQualityParams('orbitals')
  const audioConfig = useAudioMappingConfig('orbitals')
  const timeRef = useRef(0)
  
  const PARTICLE_COUNT = qualityParams.particleCount || 100
  const TRAIL_LENGTH = qualityParams.trailLength || 8
  const particlesRef = useRef<Particle[]>(createParticles(PARTICLE_COUNT))

  useEnhancedCanvasLoop(
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

      // Use normalized energies
      const bassEnergy = frame.bassEnergyNorm * sensitivity * (audioConfig.bassWeight || 1.0)
      const midEnergy = frame.midEnergyNorm * sensitivity * (audioConfig.midWeight || 1.0)
      const highEnergy = frame.highEnergyNorm * sensitivity * (audioConfig.highWeight || 1.0)

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

      // WILD Central attractor/energy source - MUCH more dramatic
      const attractorRadius = 40 + bassEnergy * 80 + midEnergy * 50 + highEnergy * 30
      
      const attractorGradient = createRadialGradient(ctx, centerX, centerY, 0, attractorRadius * 2, [
        { offset: 0, color: hsl(timeRef.current * 100 + 200, 100, 98, 1) },
        { offset: 0.2, color: hsl(timeRef.current * 100 + 210, 100, 95, 0.95 + bassEnergy * 0.05) },
        { offset: 0.4, color: hsl(timeRef.current * 100 + 220, 100, 85, 0.85 + midEnergy * 0.15) },
        { offset: 0.7, color: hsl(timeRef.current * 100 + 240, 95, 70, 0.6 + highEnergy * 0.4) },
        { offset: 0.9, color: hsl(timeRef.current * 100 + 260, 90, 55, 0.3) },
        { offset: 1, color: 'rgba(0, 0, 0, 0)' },
      ])
      
      ctx.fillStyle = attractorGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, attractorRadius * 2, 0, Math.PI * 2)
      ctx.fill()

      // WILD Inner core with pulsing rings
      const coreRadius = 25 + bassEnergy * 50 + Math.sin(timeRef.current * 3) * 10
      
      // Outer glow
      ctx.shadowBlur = 50 + bassEnergy * 80
      ctx.shadowColor = hsl(timeRef.current * 100 + 200, 100, 90, 1)
      
      ctx.fillStyle = hsl(timeRef.current * 100 + 200, 100, 98, 0.9 + bassEnergy * 0.1)
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2)
      ctx.fill()
      
      // Mid ring
      ctx.fillStyle = hsl(timeRef.current * 100 + 220, 100, 95, 0.8)
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRadius * 0.7, 0, Math.PI * 2)
      ctx.fill()
      
      // Inner bright spot
      ctx.fillStyle = hsl(timeRef.current * 100 + 240, 100, 100, 1)
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRadius * 0.4, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.shadowBlur = 0

      // WILD Orbital rings with dramatic audio response
      for (let ring = 0; ring < 5; ring++) {
        const ringDepth = (ring + 1) / 5
        const ringRadius = 100 + ring * 110 + bassEnergy * 70 * ringDepth + midEnergy * 40
        const ringAlpha = (0.4 - ring * 0.06) * (1 + midEnergy * 0.7)
        
        ctx.strokeStyle = hsl(timeRef.current * 80 + ring * 50 + 220, 95, 70, ringAlpha)
        ctx.lineWidth = (1.5 + ring * 0.5) * (1 + ringDepth * 0.7 + bassEnergy * 0.5)
        ctx.setLineDash([10, 18])
        ctx.lineDashOffset = -timeRef.current * 50 * (1 + ring * 0.8 + midEnergy * 2)
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        
        // Add glow to rings on high energy
        if (bassEnergy > 0.5 || midEnergy > 0.6) {
          ctx.shadowBlur = 15 + ringDepth * 20
          ctx.shadowColor = hsl(timeRef.current * 80 + ring * 50 + 220, 100, 80, ringAlpha * 0.8)
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }
    },
    [sensitivity, theme, PARTICLE_COUNT, TRAIL_LENGTH],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/20" />
}

export default OrbitalParticles

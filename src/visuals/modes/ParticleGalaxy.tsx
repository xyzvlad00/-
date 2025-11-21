import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// ULTRA-IMPRESSIVE: Massive 3D Galaxy Simulation with depth and spectacular effects
interface Star {
  x: number
  y: number
  z: number // 0-1 depth
  vx: number
  vy: number
  vz: number
  hue: number
  size: number
  brightness: number
  spiralArm: number
  trail: Array<{ x: number; y: number; alpha: number }>
}

const STAR_COUNT = 800 // Optimized for performance
const TRAIL_LENGTH = 10 // Reduced trail length

function ParticleGalaxy({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const timeRef = useRef(0)
  const nebulaRef = useRef<Array<{ x: number; y: number; radius: number; hue: number; alpha: number }>>([])

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      const size = Math.min(width, height)
      timeRef.current += 0.016

      // SPECTACULAR deep space background
      const bgGradient = createRadialGradient(ctx, centerX, centerY, 0, size, [
        { offset: 0, color: 'rgba(8, 5, 20, 1)' },
        { offset: 0.4, color: 'rgba(4, 2, 15, 1)' },
        { offset: 0.7, color: 'rgba(1, 0, 10, 1)' },
        { offset: 1, color: 'rgba(0, 0, 2, 1)' },
      ])
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Initialize stars with DRAMATIC spiral formation
      if (starsRef.current.length === 0) {
        const spiralArms = 5
        for (let i = 0; i < STAR_COUNT; i++) {
          const arm = i % spiralArms
          const armAngle = (arm / spiralArms) * Math.PI * 2
          const distanceFromCenter = Math.pow(Math.random(), 0.7) * size * 0.48
          const spiralTightness = 0.3
          const angle = armAngle + distanceFromCenter * spiralTightness + (Math.random() - 0.5) * 0.5

          const x = centerX + Math.cos(angle) * distanceFromCenter
          const y = centerY + Math.sin(angle) * distanceFromCenter
          const z = Math.random() // Depth

          starsRef.current.push({
            x,
            y,
            z,
            vx: 0,
            vy: 0,
            vz: 0,
            hue: 180 + arm * 40 + Math.random() * 60,
            size: 0.8 + Math.random() * 2,
            brightness: 0.5 + Math.random() * 0.5,
            spiralArm: arm,
            trail: [],
          })
        }

        // Initialize nebula clouds
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2
          const distance = size * 0.25 + Math.random() * size * 0.15
          nebulaRef.current.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            radius: 60 + Math.random() * 100,
            hue: 180 + i * 25,
            alpha: 0.08 + Math.random() * 0.12,
          })
        }
      }

      // Sort stars by depth for proper rendering
      const sortedStars = [...starsRef.current].sort((a, b) => a.z - b.z)

      // Draw SPECTACULAR nebula clouds
      nebulaRef.current.forEach((nebula) => {
        nebula.x += Math.sin(timeRef.current * 0.2) * 0.3
        nebula.y += Math.cos(timeRef.current * 0.15) * 0.3

        const pulseRadius = nebula.radius * (1 + Math.sin(timeRef.current + nebula.hue) * 0.15 + bassEnergy * 0.3)
        const pulseAlpha = nebula.alpha * (1 + midEnergy * 0.5)

        const nebulaGradient = createRadialGradient(ctx, nebula.x, nebula.y, 0, pulseRadius, [
          { offset: 0, color: hsl(nebula.hue, 85, 45, pulseAlpha * 0.8) },
          { offset: 0.3, color: hsl(nebula.hue + 20, 80, 40, pulseAlpha * 0.6) },
          { offset: 0.6, color: hsl(nebula.hue + 40, 75, 35, pulseAlpha * 0.3) },
          { offset: 1, color: 'rgba(0,0,0,0)' },
        ])

        ctx.fillStyle = nebulaGradient
        ctx.beginPath()
        ctx.arc(nebula.x, nebula.y, pulseRadius, 0, Math.PI * 2)
        ctx.fill()
      })

      // MASSIVE central black hole with accretion disk
      const blackHoleSize = 25 + bassEnergy * 45
      const diskSize = blackHoleSize * 3.5

      // Accretion disk rings
      for (let ring = 0; ring < 8; ring++) {
        const ringRadius = diskSize * (0.4 + ring * 0.15)
        const ringAlpha = (0.25 - ring * 0.025) * (1 + midEnergy * 0.6)
        const ringHue = (timeRef.current * 40 + ring * 25) % 360

        ctx.strokeStyle = hsl(ringHue, 90, 60, ringAlpha)
        ctx.lineWidth = 3 + bassEnergy * 4
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, ringRadius, ringRadius * 0.3, timeRef.current * 0.5, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Black hole core
      const coreGradient = createRadialGradient(ctx, centerX, centerY, 0, blackHoleSize, [
        { offset: 0, color: 'rgba(0, 0, 0, 1)' },
        { offset: 0.7, color: hsl(270, 100, 10, 0.9) },
        { offset: 0.85, color: hsl(280, 100, 30, 0.7) },
        { offset: 1, color: hsl(290, 100, 50, 0) },
      ])

      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, blackHoleSize, 0, Math.PI * 2)
      ctx.fill()

      // Update and render stars with SPECTACULAR effects
      sortedStars.forEach((star, idx) => {
        // Depth-based perspective
        const depthScale = 0.3 + star.z * 0.7
        const screenX = centerX + (star.x - centerX) * depthScale
        const screenY = centerY + (star.y - centerY) * depthScale

        // Spiral rotation
        const dx = star.x - centerX
        const dy = star.y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        const rotationSpeed = 0.003 / (1 + distance * 0.01) * (1 + midEnergy * 0.02)
        const newAngle = angle + rotationSpeed

        star.x = centerX + Math.cos(newAngle) * distance
        star.y = centerY + Math.sin(newAngle) * distance

        // Black hole attraction
        const distToCenter = Math.sqrt((star.x - centerX) ** 2 + (star.y - centerY) ** 2)
        const pullStrength = (1 / (distToCenter + 1)) * 0.15 * (1 + bassEnergy * 0.5)
        star.vx -= (star.x - centerX) * pullStrength
        star.vy -= (star.y - centerY) * pullStrength

        // Turbulence from audio
        star.vx += (Math.random() - 0.5) * highEnergy * 0.8
        star.vy += (Math.random() - 0.5) * highEnergy * 0.8
        star.vz += (Math.random() - 0.5) * midEnergy * 0.02

        // Apply velocity
        star.x += star.vx
        star.y += star.vy
        star.z += star.vz

        // Damping
        star.vx *= 0.98
        star.vy *= 0.98
        star.vz *= 0.95

        // Depth boundaries
        if (star.z < 0) star.z = 0
        if (star.z > 1) star.z = 1

        // Respawn if too close to center or too far
        if (distToCenter < blackHoleSize * 1.5 || distToCenter > size * 0.5) {
          const arm = star.spiralArm
          const armAngle = (arm / 5) * Math.PI * 2
          const newDistance = size * 0.3 + Math.random() * size * 0.15
          const newAngle = armAngle + newDistance * 0.3
          star.x = centerX + Math.cos(newAngle) * newDistance
          star.y = centerY + Math.sin(newAngle) * newDistance
          star.vx = 0
          star.vy = 0
        }

        // Update trail
        star.trail.unshift({ x: screenX, y: screenY, alpha: 1 })
        if (star.trail.length > TRAIL_LENGTH) {
          star.trail.pop()
        }

        // Draw SPECTACULAR trail
        for (let t = 1; t < star.trail.length; t++) {
          const trailPoint = star.trail[t]
          const prevPoint = star.trail[t - 1]
          const trailAlpha = (1 - t / TRAIL_LENGTH) * star.brightness * star.z * 0.6

          ctx.strokeStyle = hsl(star.hue, 95, 65, trailAlpha)
          ctx.lineWidth = star.size * depthScale * 0.8
          ctx.beginPath()
          ctx.moveTo(prevPoint.x, prevPoint.y)
          ctx.lineTo(trailPoint.x, trailPoint.y)
          ctx.stroke()
        }

        // Calculate brightness based on depth and audio
        const audioBrightness = 1 + (idx / STAR_COUNT) * highEnergy * 2
        const renderSize = star.size * depthScale * audioBrightness
        const renderAlpha = star.brightness * star.z * (0.6 + highEnergy * 0.4)

        // Draw star with SPECTACULAR glow
        const starGradient = createRadialGradient(ctx, screenX, screenY, 0, renderSize * 4, [
          { offset: 0, color: hsl(star.hue, 100, 95, renderAlpha) },
          { offset: 0.3, color: hsl(star.hue + 10, 95, 85, renderAlpha * 0.8) },
          { offset: 0.6, color: hsl(star.hue + 20, 90, 70, renderAlpha * 0.5) },
          { offset: 1, color: 'rgba(0,0,0,0)' },
        ])

        ctx.fillStyle = starGradient
        ctx.beginPath()
        ctx.arc(screenX, screenY, renderSize * 4, 0, Math.PI * 2)
        ctx.fill()

        // Bright core
        if (star.z > 0.7) {
          ctx.fillStyle = hsl(star.hue, 100, 98, renderAlpha * 1.2)
          ctx.beginPath()
          ctx.arc(screenX, screenY, renderSize * 1.2, 0, Math.PI * 2)
          ctx.fill()
        }

        // Lens flare for bright stars
        if (star.z > 0.8 && star.brightness > 0.8 && Math.random() > 0.98) {
          const flareLength = renderSize * 8
          ctx.strokeStyle = hsl(star.hue, 100, 90, renderAlpha * 0.4)
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(screenX - flareLength, screenY)
          ctx.lineTo(screenX + flareLength, screenY)
          ctx.moveTo(screenX, screenY - flareLength)
          ctx.lineTo(screenX, screenY + flareLength)
          ctx.stroke()
        }
      })

      // SPECTACULAR energy rays from center
      if (bassEnergy > 0.5) {
        const rayCount = 16
        for (let r = 0; r < rayCount; r++) {
          const angle = (r / rayCount) * Math.PI * 2 + timeRef.current * 0.5
          const rayLength = 120 + bassEnergy * 180
          const endX = centerX + Math.cos(angle) * rayLength
          const endY = centerY + Math.sin(angle) * rayLength

          const rayGradient = ctx.createLinearGradient(centerX, centerY, endX, endY)
          rayGradient.addColorStop(0, hsl((timeRef.current * 60 + r * 22.5) % 360, 100, 80, bassEnergy * 0.7))
          rayGradient.addColorStop(0.5, hsl((timeRef.current * 60 + r * 22.5 + 30) % 360, 95, 70, bassEnergy * 0.4))
          rayGradient.addColorStop(1, 'rgba(0,0,0,0)')

          ctx.strokeStyle = rayGradient
          ctx.lineWidth = 1.5 + bassEnergy * 3
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        }
      }

      // Info overlay
      if (frame.beatInfo?.bpm && frame.beatInfo.bpm > 0) {
        ctx.fillStyle = hsl(200, 70, 70, 0.8)
        ctx.font = 'bold 12px system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${STAR_COUNT} Stars | ${frame.beatInfo.bpm} BPM`, 15, height - 15)
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/10" />
}

export default ParticleGalaxy

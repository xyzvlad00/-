import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// Optimized tunnel with efficient rendering
interface TunnelRing {
  z: number
  rotation: number
  shapePhase: number
  energy: number
}

interface StreamParticle {
  angle: number
  z: number
  speed: number
  hue: number
  size: number
}

const RING_COUNT = 100
const MAX_PARTICLES = 150

function TunnelVortex({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ringsRef = useRef<TunnelRing[]>([])
  const particlesRef = useRef<StreamParticle[]>([])

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const time = Date.now() * 0.001
      const centerX = width / 2
      const centerY = height / 2
      const size = Math.min(width, height)

      // Efficient background
      ctx.fillStyle = 'rgba(0, 0, 12, 0.2)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, 0.78) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      const zoomSpeed = 0.7 + frame.overallVolume * sensitivity * 2

      // Initialize rings
      if (ringsRef.current.length !== RING_COUNT) {
        ringsRef.current = []
        for (let i = 0; i < RING_COUNT; i++) {
          ringsRef.current.push({
            z: i / RING_COUNT,
            rotation: Math.random() * Math.PI * 2,
            shapePhase: Math.random() * Math.PI * 2,
            energy: 0,
          })
        }
      }

      // Update and render rings
      ringsRef.current.forEach((ring, i) => {
        ring.z -= zoomSpeed * 0.015
        if (ring.z < 0) {
          ring.z = 1
          ring.rotation = time * 2
          ring.shapePhase = Math.random() * Math.PI * 2
        }

        const z = ring.z
        const perspective = 1 / (z * z * 4 + 0.01)
        const radius = size * perspective * 1.5

        if (radius < 2) return

        // Audio reactivity
        const freqIndex = Math.floor(z * frame.frequencyData.length * 0.9)
        const magnitude = frame.frequencyData[freqIndex] / 255
        ring.energy = magnitude * sensitivity

        // Rotation
        const rotation = time * zoomSpeed * (1 + z * 2) + bassEnergy * i * 0.3 + ring.rotation

        // Dynamic sides based on depth
        const sides = Math.max(6, Math.min(18, 8 + Math.floor(z * 6) + Math.floor(highEnergy * 4)))

        // Colors
        const hue = (z * 300 + time * 80 + ring.energy * 180) % 360
        const alpha = (0.3 + ring.energy * 0.7) * (1 - z * 0.5)

        if (alpha < 0.05) return

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(rotation)

        // Efficient gradient
        const gradient = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius)
        gradient.addColorStop(0, `hsla(${hue}, 96%, 68%, ${alpha * 0.2})`)
        gradient.addColorStop(0.5, `hsla(${hue + 40}, 98%, 72%, ${alpha * 0.8})`)
        gradient.addColorStop(0.9, `hsla(${hue + 90}, 100%, 70%, ${alpha})`)
        gradient.addColorStop(1, `hsla(${hue + 120}, 95%, 65%, ${alpha * 0.3})`)

        ctx.fillStyle = gradient
        ctx.beginPath()

        // Draw shape with audio distortion
        for (let j = 0; j <= sides; j++) {
          const angle = (j / sides) * Math.PI * 2
          const wave1 = Math.sin(angle * 3 + time * 3.5 + ring.shapePhase) * ring.energy * 40
          const wave2 = Math.cos(angle * 5 - time * 2) * ring.energy * 20
          const bassWave = Math.sin(angle * 2 + bassEnergy * 8) * bassEnergy * 35
          const distortion = wave1 + wave2 + bassWave
          const r = radius + distortion
          const x = Math.cos(angle) * r
          const y = Math.sin(angle) * r

          if (j === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fill()

        // Stroke for definition
        if (ring.energy > 0.45) {
          ctx.strokeStyle = `hsla(${hue + 180}, 100%, 85%, ${ring.energy * 0.8})`
          ctx.lineWidth = 1 + ring.energy * 6
          ctx.stroke()
        }

        // Inner rings for depth
        if (ring.energy > 0.55 && i % 3 === 0) {
          ctx.strokeStyle = `hsla(${hue + 130}, 100%, 90%, ${ring.energy * 0.7})`
          ctx.lineWidth = 1 + ring.energy * 3
          ctx.beginPath()
          ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.restore()
      })

      // Efficient particle system
      if (highEnergy > 0.4 && particlesRef.current.length < MAX_PARTICLES && Math.random() > 0.75) {
        particlesRef.current.push({
          angle: Math.random() * Math.PI * 2,
          z: 0.9 + Math.random() * 0.1,
          speed: 0.02 + highEnergy * 0.025,
          hue: (time * 130 + Math.random() * 60) % 360,
          size: 2 + highEnergy * 5,
        })
      }

      // Update and render particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.z -= p.speed * zoomSpeed
        p.angle += midEnergy * 0.04

        if (p.z <= 0) return false

        const perspective = 1 / (p.z * p.z * 4 + 0.01)
        const distance = Math.min(size, width) * 0.25 * perspective
        const x = centerX + Math.cos(p.angle) * distance
        const y = centerY + Math.sin(p.angle) * distance
        const renderSize = p.size * perspective

        if (renderSize < 0.5) return false

        // Efficient particle render
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, renderSize * 3)
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 85%, 0.95)`)
        gradient.addColorStop(0.5, `hsla(${p.hue + 40}, 98%, 75%, 0.6)`)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, renderSize * 3, 0, Math.PI * 2)
        ctx.fill()

        return true
      })

      // Center glow
      const centerGlow = frame.overallVolume * sensitivity
      if (centerGlow > 0.15) {
        const glowSize = 60 + centerGlow * 280
        
        for (let i = 0; i < 3; i++) {
          const layerSize = glowSize * (1 - i * 0.3)
          const layerAlpha = centerGlow * (0.8 - i * 0.25)
          
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, layerSize)
          gradient.addColorStop(0, `hsla(${time * 100 + i * 50}, 100%, 88%, ${layerAlpha})`)
          gradient.addColorStop(0.5, `hsla(${time * 100 + i * 50 + 70}, 95%, 75%, ${layerAlpha * 0.6})`)
          gradient.addColorStop(1, 'rgba(0,0,0,0)')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, layerSize, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Bass shockwaves
      if (bassEnergy > 0.6) {
        for (let i = 0; i < 3; i++) {
          const waveRadius = bassEnergy * (150 + i * 45)
          const waveAlpha = bassEnergy * (0.75 - i * 0.2)
          
          ctx.strokeStyle = `hsla(${time * 110 + i * 50}, 100%, 90%, ${waveAlpha})`
          ctx.lineWidth = 2 + bassEnergy * (5 - i * 1.5)
          ctx.shadowBlur = 25 - i * 7
          ctx.shadowColor = ctx.strokeStyle
          ctx.beginPath()
          ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.shadowBlur = 0
      }

      // Vignette
      const vignette = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(0.75, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,12,0.5)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

export default TunnelVortex

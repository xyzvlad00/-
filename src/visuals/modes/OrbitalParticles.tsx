import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'

interface Particle {
  angle: number
  speed: number
  radius: number
  size: number
  hue: number
}

const PARTICLE_COUNT = 180

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: 0.002 + Math.random() * 0.004,
    radius: 50 + Math.random() * 200,
    size: 1 + Math.random() * 2,
    hue: 180 + Math.random() * 120,
  }))
}

export function OrbitalParticles({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>(createParticles())

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame, time) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      ctx.fillStyle = 'rgba(5,6,10,0.35)'
      ctx.fillRect(0, 0, width, height)

      particlesRef.current.forEach((particle, index) => {
        const bassInfluence = 1 + frame.bassEnergy * 0.8 * sensitivity
        const midInfluence = 1 + frame.midEnergy * 0.8 * sensitivity
        const highInfluence = 1 + frame.highEnergy * 0.9 * sensitivity

        particle.angle += particle.speed * midInfluence
        const orbit = particle.radius * bassInfluence
        const x = centerX + Math.cos(particle.angle) * orbit
        const y = centerY + Math.sin(particle.angle) * orbit

        const next = particlesRef.current[(index + 7) % PARTICLE_COUNT]
        ctx.strokeStyle = `hsla(${particle.hue + frame.highEnergy * 120}, 80%, 60%, 0.15)`
        ctx.lineWidth = 0.4
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(centerX + Math.cos(next.angle) * orbit, centerY + Math.sin(next.angle) * orbit)
        ctx.stroke()

        const flicker = Math.sin(time * 0.002 + index) * 0.5 + 0.5
        ctx.fillStyle = `hsla(${particle.hue + frame.highEnergy * 200}, 90%, 70%, ${0.4 + flicker * 0.5})`
        const size = particle.size * highInfluence + flicker * 1.2
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      })
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/10" />
}


import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// Enhanced DNA Helix with particles and energy effects
function DNAHelix({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollOffsetRef = useRef(0)
  const timeRef = useRef(0)
  const particlesRef = useRef<Array<{ t: number; speed: number; hue: number; side: number }>>([])

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      timeRef.current += 0.016

      // Dark background with subtle vignette
      ctx.fillStyle = theme === 'dark' ? 'rgba(0, 2, 8, 0.15)' : 'rgba(240, 240, 250, 0.15)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Dynamic helix parameters
      const helixRadius = Math.min(width, height) * 0.18 + bassEnergy * 60
      const segmentHeight = 25 + highEnergy * 20
      const scrollSpeed = 4 + midEnergy * 12 + bassEnergy * 8
      scrollOffsetRef.current += scrollSpeed

      // Initialize particles
      if (particlesRef.current.length < 50) {
        for (let i = particlesRef.current.length; i < 50; i++) {
          particlesRef.current.push({
            t: Math.random() * Math.PI * 6,
            speed: 0.02 + Math.random() * 0.04,
            hue: Math.random() * 360,
            side: Math.random() > 0.5 ? 1 : -1
          })
        }
      }

      const NUM_SEGMENTS = 40

      // Draw background energy rings
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 8; i++) {
        const ringY = height / 2 + Math.sin(timeRef.current * 1.5 + i * 0.5) * (highEnergy * 100)
        const ringRadius = helixRadius * (2 + i * 0.4 + bassEnergy * 0.5)
        
        ctx.beginPath()
        ctx.arc(centerX, ringY, ringRadius, 0, Math.PI * 2)
        ctx.strokeStyle = hsl((timeRef.current * 40 + i * 45) % 360, 85, 60, (0.15 - i * 0.015) * (1 + midEnergy * 0.5))
        ctx.lineWidth = 2 + bassEnergy * 3
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'

      // Draw DNA helix segments with enhanced visuals
      for (let i = -10; i < NUM_SEGMENTS; i++) {
        const y = (i * segmentHeight - scrollOffsetRef.current % segmentHeight) + height / 2
        
        if (y < -100 || y > height + 100) continue

        const t = (scrollOffsetRef.current / segmentHeight + i) * 0.25
        
        // Calculate strand positions
        const leftX = centerX + Math.sin(t) * helixRadius
        const leftZ = Math.cos(t)
        const rightX = centerX + Math.sin(t + Math.PI) * helixRadius
        const rightZ = Math.cos(t + Math.PI)

        // Draw connections between strands (base pairs)
        if (Math.abs(Math.sin(t)) > 0.3) {
          const gradient = ctx.createLinearGradient(leftX, y, rightX, y)
          gradient.addColorStop(0, hsl((t * 60) % 360, 85, 60, 0.6 + leftZ * 0.3))
          gradient.addColorStop(0.5, hsl((t * 60 + 60) % 360, 90, 65, 0.8))
          gradient.addColorStop(1, hsl((t * 60 + 120) % 360, 85, 60, 0.6 + rightZ * 0.3))
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = 3 + bassEnergy * 5
          ctx.shadowBlur = 15 + bassEnergy * 15
          ctx.shadowColor = hsl((t * 60 + 60) % 360, 100, 70, 0.6)
          ctx.beginPath()
          ctx.moveTo(leftX, y)
          ctx.lineTo(rightX, y)
          ctx.stroke()
          ctx.shadowBlur = 0

          // Base pair nodes
          const baseSize = 8 + bassEnergy * 8 + highEnergy * 6
          
          // Left base
          const leftGrad = createRadialGradient(ctx, leftX, y, 0, baseSize * 2, [
            { offset: 0, color: hsl((t * 60) % 360, 100, 80, 0.9 + leftZ * 0.1) },
            { offset: 0.5, color: hsl((t * 60) % 360, 95, 70, 0.7 + leftZ * 0.2) },
            { offset: 1, color: hsl((t * 60) % 360, 90, 60, 0) },
          ])
          ctx.fillStyle = leftGrad
          ctx.beginPath()
          ctx.arc(leftX, y, baseSize * 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = hsl((t * 60) % 360, 100, 90, 1)
          ctx.beginPath()
          ctx.arc(leftX, y, baseSize, 0, Math.PI * 2)
          ctx.fill()

          // Right base
          const rightGrad = createRadialGradient(ctx, rightX, y, 0, baseSize * 2, [
            { offset: 0, color: hsl((t * 60 + 120) % 360, 100, 80, 0.9 + rightZ * 0.1) },
            { offset: 0.5, color: hsl((t * 60 + 120) % 360, 95, 70, 0.7 + rightZ * 0.2) },
            { offset: 1, color: hsl((t * 60 + 120) % 360, 90, 60, 0) },
          ])
          ctx.fillStyle = rightGrad
          ctx.beginPath()
          ctx.arc(rightX, y, baseSize * 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = hsl((t * 60 + 120) % 360, 100, 90, 1)
          ctx.beginPath()
          ctx.arc(rightX, y, baseSize, 0, Math.PI * 2)
          ctx.fill()
        }

        // Draw strand tubes with depth and glow
        const strandWidth = 14 + Math.abs(leftZ) * 10 + midEnergy * 8
        
        // Left strand
        const leftStrandGrad = createRadialGradient(ctx, leftX, y, 0, strandWidth, [
          { offset: 0, color: hsl(200, 85, 70 + leftZ * 15, 0.9 + Math.abs(leftZ) * 0.1) },
          { offset: 0.6, color: hsl(200, 80, 60 + leftZ * 15, 0.7 + Math.abs(leftZ) * 0.2) },
          { offset: 1, color: hsl(200, 75, 50 + leftZ * 15, 0.3) },
        ])
        ctx.fillStyle = leftStrandGrad
        ctx.beginPath()
        ctx.arc(leftX, y, strandWidth, 0, Math.PI * 2)
        ctx.fill()

        // Right strand
        const rightStrandGrad = createRadialGradient(ctx, rightX, y, 0, strandWidth, [
          { offset: 0, color: hsl(320, 85, 70 + rightZ * 15, 0.9 + Math.abs(rightZ) * 0.1) },
          { offset: 0.6, color: hsl(320, 80, 60 + rightZ * 15, 0.7 + Math.abs(rightZ) * 0.2) },
          { offset: 1, color: hsl(320, 75, 50 + rightZ * 15, 0.3) },
        ])
        ctx.fillStyle = rightStrandGrad
        ctx.beginPath()
        ctx.arc(rightX, y, strandWidth, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw flowing energy particles
      ctx.globalCompositeOperation = 'lighter'
      particlesRef.current.forEach((particle) => {
        particle.t += particle.speed + midEnergy * 0.02
        if (particle.t > Math.PI * 6) particle.t = 0

        const particleProgress = (particle.t % (Math.PI * 2)) / (Math.PI * 2)
        const particleY = height * particleProgress
        const particleX = centerX + Math.sin(particle.t) * helixRadius * particle.side
        const particleZ = Math.cos(particle.t)
        const particleSize = (4 + Math.abs(particleZ) * 6 + highEnergy * 5) * (0.8 + Math.random() * 0.4)

        const particleGrad = createRadialGradient(ctx, particleX, particleY, 0, particleSize * 3, [
          { offset: 0, color: hsl(particle.hue, 100, 85, 0.9) },
          { offset: 0.4, color: hsl(particle.hue + 30, 95, 75, 0.6) },
          { offset: 1, color: hsl(particle.hue + 60, 90, 65, 0) },
        ])
        
        ctx.fillStyle = particleGrad
        ctx.beginPath()
        ctx.arc(particleX, particleY, particleSize * 3, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.fillStyle = hsl(particle.hue, 100, 95, 1)
        ctx.beginPath()
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalCompositeOperation = 'source-over'

      // Tunnel vignette effect
      const vignette = ctx.createRadialGradient(centerX, height / 2, 0, centerX, height / 2, Math.max(width, height) * 0.7)
      vignette.addColorStop(0, 'transparent')
      vignette.addColorStop(0.6, 'transparent')
      vignette.addColorStop(1, theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)

      // Central energy core glow
      const coreSize = 100 + bassEnergy * 150
      const coreGrad = createRadialGradient(ctx, centerX, height / 2, 0, coreSize, [
        { offset: 0, color: hsl((timeRef.current * 30) % 360, 100, 75, 0.3 + bassEnergy * 0.4) },
        { offset: 0.4, color: hsl((timeRef.current * 30 + 60) % 360, 95, 65, 0.2 + bassEnergy * 0.3) },
        { offset: 0.7, color: hsl((timeRef.current * 30 + 120) % 360, 90, 55, 0.1 + bassEnergy * 0.2) },
        { offset: 1, color: 'transparent' },
      ])
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = coreGrad
      ctx.beginPath()
      ctx.arc(centerX, height / 2, coreSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      // Info overlay with better styling
      ctx.shadowBlur = 0
      ctx.fillStyle = theme === 'dark' ? 'rgba(100, 200, 255, 0.9)' : 'rgba(0, 50, 100, 0.9)'
      ctx.font = 'bold 24px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`⚡ ${scrollSpeed.toFixed(1)}×`, 20, 35)
      
      const distance = Math.floor(scrollOffsetRef.current / 10)
      ctx.font = 'bold 18px monospace'
      ctx.fillText(`${distance}m`, 20, 60)
    },
    [sensitivity, theme],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

export default DNAHelix

import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient, createLinearGradient } from '../utils/colors'

interface AuroraLayer {
  offset: number
  speed: number
  amplitude: number
  wavelength: number
  hue: number
  opacity: number
}

interface Droplet {
  x: number
  y: number
  size: number
  vx: number
  vy: number
  life: number
  hue: number
}

function LiquidSurface({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('liquid')
  const audioConfig = useAudioMappingConfig('liquid')
  const layersRef = useRef<AuroraLayer[]>([])
  const dropletsRef = useRef<Droplet[]>([])
  const timeRef = useRef(0)
  
  const LAYER_COUNT = qualityParams.segmentCount || 6
  const DROPLET_LIMIT = qualityParams.particleCount || 40

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      timeRef.current += 0.016

      // Dark gradient background
      const bgGradient = createLinearGradient(ctx, 0, 0, 0, height, [
        { offset: 0, color: hsl(240, 15, 8, 1) },
        { offset: 0.5, color: hsl(260, 20, 5, 1) },
        { offset: 1, color: hsl(280, 25, 3, 1) },
      ])
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Use normalized energies with config weights
      const bassEnergy = frame.bassEnergyNorm * sensitivity * (audioConfig.bassWeight || 1.0)
      const midEnergy = frame.midEnergyNorm * sensitivity * (audioConfig.midWeight || 1.0)
      const highEnergy = frame.highEnergyNorm * sensitivity * (audioConfig.highWeight || 1.0)

      // Initialize aurora layers based on quality
      if (layersRef.current.length === 0 || Math.abs(layersRef.current.length - LAYER_COUNT) > 1) {
        layersRef.current = []
        for (let i = 0; i < LAYER_COUNT; i++) {
          layersRef.current.push({
            offset: Math.random() * 1000,
            speed: 0.2 + Math.random() * 0.4,
            amplitude: 60 + Math.random() * 80,
            wavelength: 0.002 + Math.random() * 0.004,
            hue: 160 + i * 25,
            opacity: 0.3 + Math.random() * 0.3,
          })
        }
      }

      // Update and render aurora layers
      ctx.globalCompositeOperation = 'lighter'
      layersRef.current.forEach((layer, index) => {
        layer.offset += layer.speed + midEnergy * 2
        layer.hue = (layer.hue + 0.1) % 360

        const yPosition = (height / 6) * (index + 1) + Math.sin(timeRef.current * 0.5 + index) * 50

        // Draw flowing aurora layer
        ctx.beginPath()
        for (let x = 0; x <= width; x += 4) {
          const wave1 = Math.sin(x * layer.wavelength + layer.offset * 0.01) * layer.amplitude
          const wave2 = Math.cos(x * layer.wavelength * 1.5 + layer.offset * 0.008) * (layer.amplitude * 0.5)
          const wave3 = Math.sin(x * layer.wavelength * 0.5 + layer.offset * 0.012) * (layer.amplitude * 0.7)
          
          const bassWave = Math.sin(x * 0.005 + timeRef.current * 2) * bassEnergy * 60
          
          const y = yPosition + wave1 + wave2 + wave3 + bassWave

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        // Create gradient stroke for aurora effect
        const auroraOpacity = layer.opacity * (0.6 + midEnergy * 0.4)
        const gradient = ctx.createLinearGradient(0, yPosition - layer.amplitude, 0, yPosition + layer.amplitude)
        gradient.addColorStop(0, hsl(layer.hue, 85, 60, 0))
        gradient.addColorStop(0.3, hsl(layer.hue, 90, 70, auroraOpacity))
        gradient.addColorStop(0.7, hsl(layer.hue + 30, 95, 75, auroraOpacity * 0.8))
        gradient.addColorStop(1, hsl(layer.hue + 60, 100, 80, 0))

        ctx.strokeStyle = gradient
        ctx.lineWidth = 3 + highEnergy * 8
        ctx.lineCap = 'round'
        ctx.stroke()

        // Add glow
        ctx.shadowBlur = 20 + midEnergy * 30
        ctx.shadowColor = hsl(layer.hue, 100, 70, auroraOpacity * 0.5)
        ctx.stroke()
        ctx.shadowBlur = 0
      })
      ctx.globalCompositeOperation = 'source-over'

      // Create droplets on high energy (limited by quality)
      if (highEnergy > 0.5 && Math.random() > 0.85 && dropletsRef.current.length < DROPLET_LIMIT) {
        dropletsRef.current.push({
          x: Math.random() * width,
          y: -10,
          size: 2 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          life: 1,
          hue: 180 + Math.random() * 80,
        })
      }

      // Update and render droplets
      dropletsRef.current = dropletsRef.current.filter((droplet) => {
        droplet.x += droplet.vx
        droplet.y += droplet.vy
        droplet.vy += 0.15 // Gravity
        droplet.life -= 0.008

        if (droplet.life <= 0 || droplet.y > height) return false

        const dropletGradient = createRadialGradient(ctx, droplet.x, droplet.y, 0, droplet.size * 3, [
          { offset: 0, color: hsl(droplet.hue, 100, 85, droplet.life * 0.9) },
          { offset: 0.5, color: hsl(droplet.hue + 30, 95, 75, droplet.life * 0.6) },
          { offset: 1, color: hsl(droplet.hue + 60, 90, 65, 0) },
        ])

        ctx.fillStyle = dropletGradient
        ctx.beginPath()
        ctx.arc(droplet.x, droplet.y, droplet.size * 3, 0, Math.PI * 2)
        ctx.fill()

        return true
      })

      // Bass ripples
      if (bassEnergy > 0.6 && Math.random() > 0.9) {
        const rippleX = Math.random() * width
        const rippleY = Math.random() * height
        const rippleRadius = 20 + bassEnergy * 80

        for (let r = 0; r < 3; r++) {
          const rippleGradient = createRadialGradient(ctx, rippleX, rippleY, rippleRadius * (r * 0.3), rippleRadius * (r * 0.3 + 1), [
            { offset: 0, color: hsl(timeRef.current * 80 + 200, 90, 70, bassEnergy * 0.6) },
            { offset: 1, color: hsl(timeRef.current * 80 + 240, 85, 60, 0) },
          ])
          ctx.strokeStyle = rippleGradient
          ctx.lineWidth = 2 + bassEnergy * 4
          ctx.beginPath()
          ctx.arc(rippleX, rippleY, rippleRadius * (r * 0.3 + 1), 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Flowing particles
      const particleCount = Math.floor(30 + midEnergy * 40)
      ctx.globalCompositeOperation = 'lighter'
      for (let p = 0; p < particleCount; p++) {
        const px = (p / particleCount) * width + Math.sin(timeRef.current + p) * 100
        const py = ((timeRef.current * 20 + p * 50) % height)
        const pSize = 1 + Math.random() * 2
        const pHue = (timeRef.current * 50 + p * 12) % 360

        const particleGradient = createRadialGradient(ctx, px, py, 0, pSize * 4, [
          { offset: 0, color: hsl(pHue, 100, 90, 0.8) },
          { offset: 0.5, color: hsl(pHue + 40, 95, 80, 0.4) },
          { offset: 1, color: hsl(pHue + 80, 90, 70, 0) },
        ])

        ctx.fillStyle = particleGradient
        ctx.beginPath()
        ctx.arc(px, py, pSize * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      // Central energy glow
      const centerGlowRadius = 120 + frame.overallVolume * 250 * sensitivity + bassEnergy * 100
      const centerGradient = createRadialGradient(ctx, width / 2, height / 2, 0, centerGlowRadius, [
        { offset: 0, color: hsl(timeRef.current * 40 + 180, 100, 75, 0.15 + midEnergy * 0.2) },
        { offset: 0.4, color: hsl(timeRef.current * 40 + 220, 95, 65, 0.1 + midEnergy * 0.15) },
        { offset: 0.7, color: hsl(timeRef.current * 40 + 260, 90, 55, 0.05 + midEnergy * 0.1) },
        { offset: 1, color: hsl(timeRef.current * 40 + 300, 85, 45, 0) },
      ])

      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = centerGradient
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, centerGlowRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    },
    [sensitivity, LAYER_COUNT, DROPLET_LIMIT],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

export default LiquidSurface

import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl } from '../utils/colors'

interface GalleryPanel {
  x: number
  y: number
  depth: number
  width: number
  height: number
  rotation: number
  targetRotation: number
  rotationVel: number
  baseColor: number
  shearX: number
  shearY: number
  pattern: 'kaleidoscope' | 'particles' | 'grid' | 'fluid' | 'spectrum'
  opacity: number
}

interface AccentElement {
  x: number
  y: number
  size: number
  hue: number
  life: number
  vx: number
  vy: number
}

// Mind-bending non-Euclidean art gallery
function NonEuclideanGallery({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('gallery')
  const audioConfig = useAudioMappingConfig('gallery')
  const panelsRef = useRef<GalleryPanel[]>([])
  const accentsRef = useRef<AccentElement[]>([])
  const timeRef = useRef(0)
  const roomBreathRef = useRef(1)
  const perspectiveWarpRef = useRef(0)
  const lastTransientRef = useRef(0)
  const colorPaletteRef = useRef(0)

  const PANEL_COUNT = qualityParams.particleCount || 4
  const ACCENT_LIMIT = qualityParams.segmentCount || 30

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      timeRef.current += 0.016

      // Dark gallery background with vignette
      const vignette = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.6)
      vignette.addColorStop(0, theme === 'dark' ? 'rgba(8, 10, 18, 1)' : 'rgba(235, 237, 242, 1)')
      vignette.addColorStop(0.7, theme === 'dark' ? 'rgba(4, 5, 10, 1)' : 'rgba(220, 222, 230, 1)')
      vignette.addColorStop(1, theme === 'dark' ? 'rgba(0, 0, 5, 1)' : 'rgba(210, 212, 220, 1)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)

      // Use normalized energies with envelopes
      const bassEnergy = frame.bassEnergyNorm * sensitivity * (audioConfig.bassWeight || 1.3)
      const midEnergy = frame.midEnergyNorm * sensitivity * (audioConfig.midWeight || 1.2)
      const highEnergy = frame.highEnergyNorm * sensitivity * (audioConfig.highWeight || 1.1)

      // Bass: Trippy room breathing & perspective warps
      const breathTarget = 0.85 + bassEnergy * 0.3 + midEnergy * 0.2
      roomBreathRef.current += (breathTarget - roomBreathRef.current) * 0.1

      const warpTarget = (bassEnergy * 0.2 + midEnergy * 0.15) * (1 + highEnergy * 0.5)
      perspectiveWarpRef.current += (warpTarget - perspectiveWarpRef.current) * 0.15

      // Transient detection: space flips & color palette shifts
      if (frame.isTransient && timeRef.current - lastTransientRef.current > 0.3) {
        lastTransientRef.current = timeRef.current
        colorPaletteRef.current = (colorPaletteRef.current + 60) % 360
        
        // Trigger quick perspective inversion
        perspectiveWarpRef.current += 0.3
      }

      // Initialize panels
      if (panelsRef.current.length === 0) {
        const patterns: GalleryPanel['pattern'][] = ['kaleidoscope', 'particles', 'grid', 'fluid', 'spectrum']
        for (let i = 0; i < PANEL_COUNT; i++) {
          panelsRef.current.push({
            x: (Math.random() - 0.5) * width * 0.6,
            y: (Math.random() - 0.5) * height * 0.6,
            depth: 0.3 + Math.random() * 0.6,
            width: 200 + Math.random() * 200,
            height: 200 + Math.random() * 200,
            rotation: Math.random() * Math.PI * 2,
            targetRotation: 0,
            rotationVel: 0,
            baseColor: (i / PANEL_COUNT) * 360,
            shearX: 0,
            shearY: 0,
            pattern: patterns[i % patterns.length],
            opacity: 0.7 + Math.random() * 0.3,
          })
        }
      }

      // Update panels with audio-driven effects (trippy & artsy)
      panelsRef.current.forEach((panel, idx) => {
        // Audio-reactive rotation with frequency-specific response
        const freqIndex = Math.floor((idx / PANEL_COUNT) * frame.frequencyData.length)
        const panelEnergy = frame.frequencyData[freqIndex] / 255
        
        panel.targetRotation = panelEnergy * Math.PI * 0.8 + midEnergy * Math.PI * 0.6
        panel.rotationVel += (panel.targetRotation - panel.rotation) * 0.12
        panel.rotationVel *= 0.94
        panel.rotation += panel.rotationVel

        // Trippy shearing based on audio
        const targetShearX = (panelEnergy - 0.5) * midEnergy * 0.5
        const targetShearY = (0.5 - panelEnergy) * bassEnergy * 0.4
        panel.shearX += (targetShearX - panel.shearX) * 0.15
        panel.shearY += (targetShearY - panel.shearY) * 0.15

        // Dynamic depth based on energy
        const targetDepth = 0.3 + panelEnergy * 0.5 + bassEnergy * 0.3
        panel.depth += (targetDepth - panel.depth) * 0.12
        
        // Color shifts
        panel.baseColor = (panel.baseColor + panelEnergy * 2 + highEnergy * 3) % 360
      })

      // Sort panels by depth (back to front)
      const sortedPanels = [...panelsRef.current].sort((a, b) => a.depth - b.depth)

      // Background grid that curves with bass
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.strokeStyle = theme === 'dark' ? 'rgba(40, 50, 80, 0.15)' : 'rgba(180, 190, 200, 0.15)'
      ctx.lineWidth = 1
      
      const gridSize = 50
      const gridExtent = Math.max(width, height)
      for (let x = -gridExtent; x < gridExtent; x += gridSize) {
        ctx.beginPath()
        for (let y = -gridExtent; y < gridExtent; y += gridSize / 4) {
          const curvature = Math.sin(y * 0.01 + timeRef.current * 0.5) * bassEnergy * 30
          if (y === -gridExtent) ctx.moveTo(x + curvature, y)
          else ctx.lineTo(x + curvature, y)
        }
        ctx.stroke()
      }
      ctx.restore()

      // Draw panels with impossible geometry
      ctx.save()
      ctx.translate(centerX, centerY)
      
      sortedPanels.forEach((panel) => {
        ctx.save()
        
        // Apply room breathing
        ctx.scale(roomBreathRef.current, roomBreathRef.current)
        
        // Perspective projection
        const scale = 0.4 + panel.depth * 0.8 + perspectiveWarpRef.current * 0.2
        const perspectiveX = panel.x * scale
        const perspectiveY = panel.y * scale
        
        ctx.translate(perspectiveX, perspectiveY)
        ctx.rotate(panel.rotation)
        
        // Non-Euclidean shearing
        ctx.transform(1, panel.shearY, panel.shearX, 1, 0, 0)
        
        const w = panel.width * scale
        const h = panel.height * scale
        
        // Panel background
        const hue = (panel.baseColor + colorPaletteRef.current + highEnergy * 80) % 360
        ctx.fillStyle = hsl(hue, 60, 35 + panel.depth * 20, panel.opacity * (0.5 + midEnergy * 0.3))
        ctx.fillRect(-w / 2, -h / 2, w, h)
        
        // Draw pattern based on panel type
        ctx.save()
        ctx.clip(new Path2D(`M ${-w/2} ${-h/2} L ${w/2} ${-h/2} L ${w/2} ${h/2} L ${-w/2} ${h/2} Z`))
        
        switch (panel.pattern) {
          case 'kaleidoscope':
            // Kaleidoscope shards
            ctx.strokeStyle = hsl(hue + 40, 80, 60, 0.4 + highEnergy * 0.4)
            ctx.lineWidth = 1 + highEnergy * 2
            for (let s = 0; s < 6; s++) {
              const angle = (s / 6) * Math.PI * 2
              ctx.beginPath()
              ctx.moveTo(0, 0)
              ctx.lineTo(Math.cos(angle) * w * 0.4, Math.sin(angle) * h * 0.4)
              ctx.stroke()
            }
            break
            
          case 'particles':
            // Particle hints
            for (let p = 0; p < 15; p++) {
              const px = (Math.random() - 0.5) * w * 0.8
              const py = (Math.random() - 0.5) * h * 0.8
              const psize = 1 + Math.random() * 3 + highEnergy * 2
              ctx.fillStyle = hsl(hue + 60, 90, 70, 0.3 + highEnergy * 0.5)
              ctx.beginPath()
              ctx.arc(px, py, psize, 0, Math.PI * 2)
              ctx.fill()
            }
            break
            
          case 'grid':
            // Grid lines
            ctx.strokeStyle = hsl(hue + 80, 70, 55, 0.3 + midEnergy * 0.4)
            ctx.lineWidth = 0.5 + highEnergy
            const gridStep = w / 8
            for (let gx = -w / 2; gx < w / 2; gx += gridStep) {
              ctx.beginPath()
              ctx.moveTo(gx, -h / 2)
              ctx.lineTo(gx, h / 2)
              ctx.stroke()
            }
            for (let gy = -h / 2; gy < h / 2; gy += gridStep) {
              ctx.beginPath()
              ctx.moveTo(-w / 2, gy)
              ctx.lineTo(w / 2, gy)
              ctx.stroke()
            }
            break
            
          case 'fluid':
            // Fluid wave
            ctx.strokeStyle = hsl(hue + 100, 75, 60, 0.5 + bassEnergy * 0.3)
            ctx.lineWidth = 2 + bassEnergy * 3
            ctx.beginPath()
            for (let fx = -w / 2; fx < w / 2; fx += 5) {
              const fy = Math.sin(fx * 0.02 + timeRef.current * 2) * h * 0.2 * bassEnergy
              if (fx === -w / 2) ctx.moveTo(fx, fy)
              else ctx.lineTo(fx, fy)
            }
            ctx.stroke()
            break
            
          case 'spectrum':
            // Spectrum bars
            const bars = 12
            const barWidth = w / bars
            for (let b = 0; b < bars; b++) {
              const freqIdx = Math.floor((b / bars) * frame.frequencyData.length)
              const barHeight = (frame.frequencyData[freqIdx] / 255) * h * 0.6 * sensitivity
              ctx.fillStyle = hsl(hue + b * 10, 85, 55, 0.6)
              ctx.fillRect(-w / 2 + b * barWidth, h / 2 - barHeight, barWidth - 2, barHeight)
            }
            break
        }
        
        ctx.restore()
        
        // High: Edge glow & outlines
        if (highEnergy > 0.3) {
          ctx.strokeStyle = hsl(hue + 120, 90, 65, highEnergy * 0.6)
          ctx.lineWidth = 1 + highEnergy * 3
          ctx.shadowBlur = 8 + highEnergy * 12
          ctx.shadowColor = hsl(hue + 120, 100, 70, highEnergy * 0.8)
          ctx.strokeRect(-w / 2, -h / 2, w, h)
          ctx.shadowBlur = 0
        }
        
        ctx.restore()
      })
      
      ctx.restore()

      // High: Accent elements (sparkles, interference) - reduced spawn rate
      if (Math.random() < 0.1 + highEnergy * 0.3 && accentsRef.current.length < ACCENT_LIMIT) {
        accentsRef.current.push({
          x: (Math.random() - 0.5) * width,
          y: (Math.random() - 0.5) * height,
          size: 2 + Math.random() * 4,
          hue: (Math.random() * 360 + colorPaletteRef.current) % 360,
          life: 1,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
        })
      }

      // Update & draw accents
      ctx.save()
      ctx.translate(centerX, centerY)
      accentsRef.current = accentsRef.current.filter((accent) => {
        accent.x += accent.vx
        accent.y += accent.vy
        accent.life -= 0.02
        
        if (accent.life <= 0) return false
        
        // Micro jitter on high energy
        const jitterX = (Math.random() - 0.5) * highEnergy * 2
        const jitterY = (Math.random() - 0.5) * highEnergy * 2
        
        ctx.fillStyle = hsl(accent.hue, 90, 70, accent.life * 0.8)
        ctx.beginPath()
        ctx.arc(accent.x + jitterX, accent.y + jitterY, accent.size * accent.life, 0, Math.PI * 2)
        ctx.fill()
        
        return true
      })
      ctx.restore()

      // Overlay interference pattern on transient
      if (timeRef.current - lastTransientRef.current < 0.2) {
        const flashAlpha = 1 - (timeRef.current - lastTransientRef.current) / 0.2
        ctx.strokeStyle = hsl(colorPaletteRef.current, 90, 70, flashAlpha * 0.3)
        ctx.lineWidth = 1
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2
          const radius = Math.min(width, height) * 0.4
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius + i * 10, angle, angle + Math.PI * 0.1)
          ctx.stroke()
        }
      }
    },
    [sensitivity, theme, PANEL_COUNT, ACCENT_LIMIT],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/50" />
}

export default NonEuclideanGallery


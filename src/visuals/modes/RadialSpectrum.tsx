import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'
import { mapFrequencyIndexToEnergy, mapBandEnergyToRadius } from '../utils/visualMapping'

// Elegant circular equalizer with smooth depth
function RadialSpectrum({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('radial')
  const audioConfig = useAudioMappingConfig('radial')
  const timeRef = useRef(0)
  
  const NUM_BARS = qualityParams.segmentCount || 96
  const barsRef = useRef<number[]>([])
  
  // Update bars array if size changes
  if (barsRef.current.length !== NUM_BARS) {
    barsRef.current = Array(NUM_BARS).fill(0)
  }
  
  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.min(width, height) * 0.42
      
      // Dynamic center radius based on bass
      const centerRadius = mapBandEnergyToRadius(frame, 'bass', maxRadius * 0.2, 1.5, audioConfig)
      
      timeRef.current += 0.016

      // Dark elegant background
      const bgGradient = createRadialGradient(ctx, centerX, centerY, 0, maxRadius * 1.5, [
        { offset: 0, color: theme === 'dark' ? 'rgba(8, 10, 20, 1)' : 'rgba(245, 247, 250, 1)' },
        { offset: 0.6, color: theme === 'dark' ? 'rgba(3, 5, 12, 1)' : 'rgba(235, 238, 245, 1)' },
        { offset: 1, color: theme === 'dark' ? 'rgba(0, 0, 6, 1)' : 'rgba(220, 225, 235, 1)' },
      ])
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Process audio data with enhanced mapping
      const angleStep = (Math.PI * 2) / NUM_BARS

      // Update bars with enhanced mapping and WILD responsiveness
      for (let i = 0; i < NUM_BARS; i++) {
        const enhancedValue = mapFrequencyIndexToEnergy(frame, i, NUM_BARS, sensitivity * (audioConfig.motionSensitivity || 1.3))
        
        // Faster, more dramatic interpolation for WILD effect
        barsRef.current[i] += (enhancedValue - barsRef.current[i]) * 0.35
      }

      // Draw bars with depth effect
      ctx.globalCompositeOperation = 'lighter'
      
      // WILD volume scaling - bars get MUCH taller with higher overall volume
      const volumeScale = 0.6 + frame.overallVolumeNorm * 0.8 // 0.6 to 1.4 range - MORE dramatic
      const bassBoost = 1 + frame.bassEnergyNorm * 0.5 // Extra boost on bass
      
      for (let i = 0; i < NUM_BARS; i++) {
        const angle = i * angleStep - Math.PI / 2 // Start from top
        const value = barsRef.current[i]
        
        // WILD bar dimensions - scale dramatically with overall volume
        const barLength = value * (maxRadius - centerRadius) * volumeScale * bassBoost
        const startRadius = centerRadius
        const endRadius = startRadius + barLength
        
        // Calculate positions
        const x1 = centerX + Math.cos(angle) * startRadius
        const y1 = centerY + Math.sin(angle) * startRadius
        const x2 = centerX + Math.cos(angle) * endRadius
        const y2 = centerY + Math.sin(angle) * endRadius
        
        // Color based on position with smooth transition
        const huePosition = i / NUM_BARS
        const hue = (huePosition * 280 + timeRef.current * 15) % 360
        
        // WILD glow layer (larger, more intense)
        if (value > 0.1) {
          ctx.shadowBlur = 25 + value * 40
          ctx.shadowColor = hsl(hue, 100, 70, value * 0.8)
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = hsl(hue, 95, 75, value * 0.7)
          ctx.lineWidth = 5 + value * 8
          ctx.lineCap = 'round'
          ctx.stroke()
          ctx.shadowBlur = 0
        }
        
        // Draw main bar (thicker, more dramatic)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = hsl(hue, 95, 60 + value * 20, 0.9)
        ctx.lineWidth = 3 + value * 4
        ctx.lineCap = 'round'
        ctx.stroke()
        
        // WILD inner highlight (more dramatic depth effect)
        if (value > 0.2) {
          const midRadius = startRadius + barLength * 0.4
          const mx = centerX + Math.cos(angle) * midRadius
          const my = centerY + Math.sin(angle) * midRadius
          
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(mx, my)
          ctx.strokeStyle = hsl(hue + 30, 100, 90, value * 0.9)
          ctx.lineWidth = 2 + value * 2
          ctx.lineCap = 'round'
          ctx.stroke()
        }
        
        // Extra WILD tip glow for high values
        if (value > 0.6) {
          ctx.shadowBlur = 30 + value * 50
          ctx.shadowColor = hsl(hue, 100, 80, value)
          ctx.fillStyle = hsl(hue, 100, 90, value * 0.8)
          ctx.beginPath()
          ctx.arc(x2, y2, 3 + value * 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
      
      ctx.globalCompositeOperation = 'source-over'

      // Central circle with gradient
      const centralGradient = createRadialGradient(ctx, centerX, centerY, 0, centerRadius, [
        { offset: 0, color: hsl((timeRef.current * 30) % 360, 90, 65, 0.9) },
        { offset: 0.4, color: hsl((timeRef.current * 30 + 40) % 360, 85, 55, 0.7) },
        { offset: 0.7, color: hsl((timeRef.current * 30 + 80) % 360, 80, 45, 0.4) },
        { offset: 1, color: 'rgba(0, 0, 0, 0.1)' },
      ])
      
      ctx.fillStyle = centralGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2)
      ctx.fill()

      // Central circle border
      ctx.beginPath()
      ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2)
      ctx.strokeStyle = hsl((timeRef.current * 30) % 360, 90, 70, 0.6)
      ctx.lineWidth = 2
      ctx.shadowBlur = 15
      ctx.shadowColor = hsl((timeRef.current * 30) % 360, 100, 70, 0.5)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Pulsing center core with normalized bass
      const coreSize = 8 + frame.bassEnergyNorm * sensitivity * 20
      
      const coreGradient = createRadialGradient(ctx, centerX, centerY, 0, coreSize, [
        { offset: 0, color: hsl((timeRef.current * 30) % 360, 100, 90, 1) },
        { offset: 0.5, color: hsl((timeRef.current * 30 + 30) % 360, 100, 80, 0.7) },
        { offset: 1, color: 'transparent' },
      ])
      
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      // Subtle outer ring guide
      ctx.beginPath()
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2)
      ctx.strokeStyle = theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.03)' 
        : 'rgba(0, 0, 0, 0.05)'
      ctx.lineWidth = 1
      ctx.stroke()
    },
    [sensitivity, theme, NUM_BARS],
  )

  return <canvas ref={canvasRef} className="block h-full w-full rounded-3xl bg-black/20" />
}

export default RadialSpectrum

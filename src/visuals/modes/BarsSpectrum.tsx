import { useMemo, useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createLinearGradient, getThemePalette } from '../utils/colors'
import { applyGlow, clearGlow } from '../utils/shapes'
import { mapFrequencyIndexToEnergy, mapEnergyToHueShift } from '../utils/visualMapping'

function BarsSpectrum({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('bars')
  const audioConfig = useAudioMappingConfig('bars')
  
  const BAR_COUNT = qualityParams.segmentCount || 128
  const peakHoldRef = useRef<number[]>(new Array(BAR_COUNT).fill(0))
  const peakFallRef = useRef<number[]>(new Array(BAR_COUNT).fill(0))
  
  const colors = useMemo(() => getThemePalette(theme).primary, [theme])

  // Update peak arrays if BAR_COUNT changes
  if (peakHoldRef.current.length !== BAR_COUNT) {
    peakHoldRef.current = new Array(BAR_COUNT).fill(0)
    peakFallRef.current = new Array(BAR_COUNT).fill(0)
  }

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      ctx.fillStyle = theme === 'dark' ? 'rgba(5,6,10,0.25)' : 'rgba(250,250,255,0.3)'
      ctx.fillRect(0, 0, width, height)

      const barWidth = width / BAR_COUNT
      const time = Date.now() * 0.001

      for (let i = 0; i < BAR_COUNT; i++) {
        // Use enhanced mapping with perceptual curve
        const eased = mapFrequencyIndexToEnergy(frame, i, BAR_COUNT, sensitivity * (audioConfig.motionSensitivity || 1.0))
        
        const barHeight = Math.min(height * 0.92, eased * height * 1.4)
        const x = i * barWidth
        const y = height - barHeight
        
        // Peak hold system
        if (barHeight > peakHoldRef.current[i]) {
          peakHoldRef.current[i] = barHeight
          peakFallRef.current[i] = 0
        } else {
          peakFallRef.current[i] += 1
          if (peakFallRef.current[i] > 3) {
            peakHoldRef.current[i] = Math.max(0, peakHoldRef.current[i] - height * 0.015)
          }
        }
        
        // Color calculation with enhanced mapping
        const freqRatio = i / BAR_COUNT
        const baseHue = freqRatio * 280 + time * 25
        const hueShift = mapEnergyToHueShift(frame, baseHue, 30, audioConfig)
        
        // Bar gradient with enhanced colors
        const barGradient = createLinearGradient(ctx, x, y + barHeight, x, y, [
          { offset: 0, color: hsl(hueShift, 85, 58, 0.9) },
          { offset: 0.5, color: hsl(hueShift + 30, 90, 65, 0.95) },
          { offset: 1, color: hsl(hueShift + 60, 95, 72, 1) },
        ])
        
        ctx.fillStyle = barGradient
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight)
        
        // Glow effect for high energy bars
        if (eased > 0.6) {
          applyGlow(ctx, hsl(hueShift + 40, 100, 75, eased * 0.8), 12 + eased * 18)
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight)
          clearGlow(ctx)
        }
        
        // Top highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + eased * 0.2})`
        ctx.fillRect(x + 1, y, barWidth - 2, Math.max(2, barHeight * 0.05))
        
        // Peak indicator
        if (peakHoldRef.current[i] > height * 0.1) {
          const peakY = height - peakHoldRef.current[i]
          ctx.fillStyle = hsl(hueShift + 80, 100, 80, 0.9)
          ctx.fillRect(x + 1, peakY - 2, barWidth - 2, 3)
          
          // Peak glow
          applyGlow(ctx, hsl(hueShift + 80, 100, 80, 0.7), 8)
          ctx.fillRect(x + 1, peakY - 2, barWidth - 2, 3)
          clearGlow(ctx)
        }
      }
      
      // Subtle bottom reflection - Fixed approach
      ctx.save()
      ctx.globalAlpha = 0.08 // Much lower alpha
      ctx.globalCompositeOperation = 'lighter' // Better blending
      ctx.translate(0, height)
      ctx.scale(1, -0.2) // Shorter reflection
      
      // Create a clipping region to only reflect the bottom portion
      ctx.beginPath()
      ctx.rect(0, 0, width, height * 0.15)
      ctx.clip()
      
      ctx.drawImage(ctx.canvas, 0, 0)
      ctx.restore()
    },
    [sensitivity, theme, colors, BAR_COUNT],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/10" />
}

export default BarsSpectrum

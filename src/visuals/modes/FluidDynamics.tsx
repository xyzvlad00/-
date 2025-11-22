import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, hslToRgb, createRadialGradient } from '../utils/colors'

function FluidDynamics({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('fluid')
  const audioConfig = useAudioMappingConfig('fluid')
  const metaballsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number; hue: number; energy: number }>>([])
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null)

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const time = Date.now() * 0.001
      const centerX = width / 2
      const centerY = height / 2

      // Use quality params for resolution and particle count
      const targetResolution = qualityParams.resolution || 480
      const maxBalls = qualityParams.particleCount || 8
      const renderScale = Math.min(1.0, targetResolution / Math.max(width, height))
      
      const renderWidth = Math.max(120, Math.floor(width * renderScale))
      const renderHeight = Math.max(120, Math.floor(height * renderScale))

      if (!offscreenCanvasRef.current || 
          offscreenCanvasRef.current.width !== renderWidth || 
          offscreenCanvasRef.current.height !== renderHeight) {
        offscreenCanvasRef.current = document.createElement('canvas')
        offscreenCanvasRef.current.width = renderWidth
        offscreenCanvasRef.current.height = renderHeight
        offscreenCtxRef.current = offscreenCanvasRef.current.getContext('2d', { 
          alpha: true,
          desynchronized: true 
        })
      }

      ctx.fillStyle = 'rgba(0, 0, 8, 0.1)'
      ctx.fillRect(0, 0, width, height)

      // Use normalized energies with audio config weights
      const bassForce = frame.bassEnergyNorm * sensitivity * (audioConfig.bassWeight || 1.0) * 0.6
      const midFlow = frame.midEnergyNorm * sensitivity * (audioConfig.midWeight || 1.0) * 0.65
      const highSpark = frame.highEnergyNorm * sensitivity * (audioConfig.highWeight || 1.0) * 0.7

      if (metaballsRef.current.length < maxBalls && (frame.overallVolume > 0.3 || metaballsRef.current.length < maxBalls * 0.5)) {
        if (Math.random() > 0.88 || metaballsRef.current.length < 5) {
          const angle = Math.random() * Math.PI * 2
          const distance = Math.random() * Math.min(width, height) * 0.3
          metaballsRef.current.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 2.5,
            radius: 40 + Math.random() * 45,
            hue: (time * 50 + Math.random() * 360) % 360,
            energy: 0.5 + Math.random() * 0.5,
          })
        }
      }

      metaballsRef.current.forEach((ball, i) => {
        // More dynamic frequency mapping - each ball responds to different frequency range
        const freqStart = Math.floor((i / metaballsRef.current.length) * frame.frequencyData.length * 0.8)
        const freqEnd = Math.min(freqStart + 8, frame.frequencyData.length)
        let magnitudeSum = 0
        for (let f = freqStart; f < freqEnd; f++) {
          magnitudeSum += frame.frequencyData[f] / 255
        }
        const magnitude = magnitudeSum / (freqEnd - freqStart)
        
        // Faster energy response for more dynamic visuals
        const smoothEnergy = ball.energy * 0.7 + magnitude * sensitivity * 0.3
        ball.energy = smoothEnergy

        const dx = centerX - ball.x
        const dy = centerY - ball.y
        const distSq = dx * dx + dy * dy
        const dist = Math.sqrt(distSq)

        // Dynamic attraction/repulsion based on frequency
        if (dist > 1) {
          const attraction = (magnitude > 0.5 ? -0.8 : 0.6) * bassForce * (1 + ball.energy * 0.5)
          ball.vx += (dx / dist) * attraction
          ball.vy += (dy / dist) * attraction
        }

        // More dynamic vortex
        const angle = Math.atan2(dy, dx)
        const vortexStrength = midFlow * 2.0 * (1 + ball.energy * 0.5)
        const vortexDirection = magnitude > 0.5 ? -1 : 1
        ball.vx += Math.cos(angle + Math.PI / 2 * vortexDirection) * vortexStrength
        ball.vy += Math.sin(angle + Math.PI / 2 * vortexDirection) * vortexStrength

        // More dramatic high frequency response
        if (highSpark > 0.3) {
          ball.vx += (Math.random() - 0.5) * highSpark * 3
          ball.vy += (Math.random() - 0.5) * highSpark * 3
        }

        ball.x += ball.vx
        ball.y += ball.vy
        ball.vx *= 0.96
        ball.vy *= 0.96

        // More dramatic size variation
        ball.radius = 35 + ball.energy * 80 + bassForce * 18 + magnitude * 25

        const margin = ball.radius * 1.5
        if (ball.x < -margin) ball.x = width + margin
        if (ball.x > width + margin) ball.x = -margin
        if (ball.y < -margin) ball.y = height + margin
        if (ball.y > height + margin) ball.y = -margin
        
        // More dynamic color changes
        ball.hue = (ball.hue + midFlow * 2.0 + ball.energy * 0.8 + magnitude * 1.5) % 360
      })

      const imageData = offscreenCtxRef.current!.createImageData(renderWidth, renderHeight)
      const data = imageData.data
      
      const scaleX = width / renderWidth
      const scaleY = height / renderHeight
      
      const ballData = metaballsRef.current.map(ball => ({
        x: ball.x,
        y: ball.y,
        radiusSq: ball.radius * ball.radius,
        energy: ball.energy,
        hue: ball.hue,
        maxInfluence: ball.radius * 2.5,
        maxInfluenceSq: (ball.radius * 2.5) * (ball.radius * 2.5)
      }))

      // Calculate bounding box for spatial culling
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const ball of ballData) {
        const radius = ball.maxInfluence
        minX = Math.min(minX, ball.x - radius)
        minY = Math.min(minY, ball.y - radius)
        maxX = Math.max(maxX, ball.x + radius)
        maxY = Math.max(maxY, ball.y + radius)
      }
      
      // Convert world coordinates to pixel coordinates
      const startPy = Math.max(0, Math.floor(minY / scaleY))
      const endPy = Math.min(renderHeight, Math.ceil(maxY / scaleY))
      const startPx = Math.max(0, Math.floor(minX / scaleX))
      const endPx = Math.min(renderWidth, Math.ceil(maxX / scaleX))

      // Only process pixels within the bounding box
      for (let py = startPy; py < endPy; py++) {
        const worldY = py * scaleY
        const baseIdx = py * renderWidth * 4
        
        for (let px = startPx; px < endPx; px++) {
          const worldX = px * scaleX
          
          let sum = 0
          let hueSum = 0
          let energySum = 0

          for (const ball of ballData) {
            const dx = worldX - ball.x
            const dy = worldY - ball.y
            const distSq = dx * dx + dy * dy
            
            if (distSq > ball.maxInfluenceSq) continue
            
            const influence = ball.radiusSq / (distSq + 1)
            const weightedInfluence = influence * ball.energy
            sum += weightedInfluence
            hueSum += ball.hue * weightedInfluence
            energySum += weightedInfluence
          }

          if (sum > 0.22) {
            const avgHue = hueSum / (energySum + 0.01)
            const intensity = Math.min(sum * 2.0, 1)
            const saturation = 70 + intensity * 30
            const lightness = 30 + intensity * 50

            const rgb = hslToRgb(avgHue, saturation, lightness)

            const idx = baseIdx + px * 4
            data[idx] = rgb.r * intensity
            data[idx + 1] = rgb.g * intensity
            data[idx + 2] = rgb.b * intensity
            data[idx + 3] = intensity * 255
          }
        }
      }

      offscreenCtxRef.current!.putImageData(imageData, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(offscreenCanvasRef.current!, 0, 0, renderWidth, renderHeight, 0, 0, width, height)

      ctx.globalCompositeOperation = 'lighter'
      metaballsRef.current.forEach((ball) => {
        if (ball.energy > 0.6) {
          const glowSize = ball.radius * 1.4
          const gradient = createRadialGradient(ctx, ball.x, ball.y, 0, glowSize, [
            { offset: 0, color: hsl(ball.hue, 100, 75, ball.energy * 0.5) },
            { offset: 0.5, color: hsl(ball.hue + 60, 95, 65, ball.energy * 0.3) },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ])

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(ball.x, ball.y, glowSize, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      ctx.globalCompositeOperation = 'source-over'

      if (metaballsRef.current.length > maxBalls + 5) {
        metaballsRef.current = metaballsRef.current.slice(-maxBalls)
      }
    },
    [sensitivity, qualityParams.resolution, qualityParams.particleCount],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

export default FluidDynamics

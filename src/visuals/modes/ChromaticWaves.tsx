import { useRef } from 'react'
import { useEnhancedCanvasLoop, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'

function ChromaticWaves({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioConfig = useAudioMappingConfig('chromatic')

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const time = Date.now() * 0.001

      // Stylish dark background with subtle gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, 'rgba(5, 0, 15, 0.2)')
      bgGrad.addColorStop(0.5, 'rgba(0, 5, 20, 0.2)')
      bgGrad.addColorStop(1, 'rgba(10, 0, 10, 0.2)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Use normalized energies with config weights
      const bassOffset = Math.pow(frame.bassEnergyNorm * (audioConfig.bassWeight || 1.0), 0.8) * sensitivity * 60
      const midFreq = Math.pow(frame.midEnergyNorm * (audioConfig.midWeight || 1.0), 0.9) * sensitivity * 2
      const highAberration = Math.pow(frame.highEnergyNorm * (audioConfig.highWeight || 1.0), 1) * sensitivity * 20

      const waveCount = 12
      for (let w = 0; w < waveCount; w++) {
        const waveProgress = w / waveCount
        const freqIndex = Math.floor(waveProgress * frame.frequencyData.length * 0.8)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 1.2) * sensitivity

        const baseY = (height / waveCount) * w + height / (waveCount * 2)
        const amplitude = 15 + easedMag * 80
        const frequency = 0.004 + midFreq * 0.004
        const phase = time * 0.8 + waveProgress * 0.5 + bassOffset * 0.15

        // More dramatic chromatic separation with RGB split
        const channels = [
          { offset: -highAberration * 1.5, hue: 350, saturation: 100, lightness: 60, alpha: 0.7 + magnitude * 0.3, name: 'red' },
          { offset: 0, hue: 180, saturation: 100, lightness: 65, alpha: 0.8 + magnitude * 0.2, name: 'cyan' },
          { offset: highAberration * 1.5, hue: 280, saturation: 100, lightness: 60, alpha: 0.7 + magnitude * 0.3, name: 'magenta' },
        ]

        channels.forEach((channel) => {
          ctx.beginPath()
          ctx.lineWidth = 2.5 + easedMag * 5
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          const gradient = ctx.createLinearGradient(0, 0, width, 0)
          gradient.addColorStop(0, `hsla(${channel.hue}, ${channel.saturation}%, ${channel.lightness}%, ${channel.alpha})`)
          gradient.addColorStop(0.5, `hsla(${channel.hue + 20}, ${channel.saturation}%, ${channel.lightness + 10}%, ${channel.alpha * 1.2})`)
          gradient.addColorStop(1, `hsla(${channel.hue + 40}, ${channel.saturation}%, ${channel.lightness}%, ${channel.alpha})`)

          ctx.strokeStyle = gradient

          for (let x = 0; x <= width; x += 3) {
            const wave1 = Math.sin(x * frequency + phase) * amplitude
            const wave2 = Math.sin(x * frequency * 1.8 - phase * 0.8) * amplitude * 0.4
            const y = baseY + wave1 + wave2 + channel.offset

            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }

          ctx.stroke()

          // Enhanced glow for all waves
          if (magnitude > 0.4) {
            ctx.shadowBlur = 15 + magnitude * 25
            ctx.shadowColor = `hsla(${channel.hue}, 100%, 75%, ${magnitude * 0.8})`
            ctx.lineWidth = 1.5 + easedMag * 3
            ctx.stroke()
            ctx.shadowBlur = 0
          }
          
          // Extra chromatic bloom on high energy
          if (magnitude > 0.7) {
            ctx.globalCompositeOperation = 'lighter'
            ctx.strokeStyle = `hsla(${channel.hue}, 100%, 80%, ${magnitude * 0.4})`
            ctx.lineWidth = 3 + easedMag * 4
            ctx.shadowBlur = 20 + magnitude * 30
            ctx.stroke()
            ctx.shadowBlur = 0
            ctx.globalCompositeOperation = 'source-over'
          }
        })
      }

      // Subtle frequency pulses
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 6; i++) {
        const x = (i / 6) * width
        const freqIndex = Math.floor((i / 6) * frame.frequencyData.length * 0.6)
        const magnitude = frame.frequencyData[freqIndex] / 255

        if (magnitude > 0.5) {
          const size = 40 + magnitude * 100
          const gradient = ctx.createRadialGradient(x, height / 2, 0, x, height / 2, size)
          const hue = (i / 6) * 360 + time * 30
          gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${magnitude * 0.4})`)
          gradient.addColorStop(0.6, `hsla(${hue + 60}, 95%, 65%, ${magnitude * 0.2})`)
          gradient.addColorStop(1, 'rgba(0,0,0,0)')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, height / 2, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalCompositeOperation = 'source-over'
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

export default ChromaticWaves

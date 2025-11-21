import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'

function ChromaticWaves({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const time = Date.now() * 0.001

      ctx.fillStyle = 'rgba(0, 0, 10, 0.15)'
      ctx.fillRect(0, 0, width, height)

      const bassOffset = Math.pow(frame.bassEnergy, 0.8) * sensitivity * 60
      const midFreq = Math.pow(frame.midEnergy, 0.9) * sensitivity * 2
      const highAberration = Math.pow(frame.highEnergy, 1) * sensitivity * 20

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

        const hueShift = (waveProgress * 300 + time * 40) % 360

        const channels = [
          { offset: -highAberration, hue: hueShift, alpha: 0.5 + magnitude * 0.4 },
          { offset: 0, hue: hueShift + 120, alpha: 0.6 + magnitude * 0.3 },
          { offset: highAberration, hue: hueShift + 240, alpha: 0.5 + magnitude * 0.4 },
        ]

        channels.forEach((channel) => {
          ctx.beginPath()
          ctx.lineWidth = 2 + easedMag * 4
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          const gradient = ctx.createLinearGradient(0, 0, width, 0)
          gradient.addColorStop(0, `hsla(${channel.hue}, 90%, 55%, ${channel.alpha})`)
          gradient.addColorStop(0.5, `hsla(${channel.hue + 30}, 95%, 65%, ${channel.alpha * 1.1})`)
          gradient.addColorStop(1, `hsla(${channel.hue + 60}, 90%, 55%, ${channel.alpha})`)

          ctx.strokeStyle = gradient

          for (let x = 0; x <= width; x += 3) {
            const wave1 = Math.sin(x * frequency + phase) * amplitude
            const wave2 = Math.sin(x * frequency * 1.8 - phase * 0.8) * amplitude * 0.4
            const y = baseY + wave1 + wave2 + channel.offset

            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }

          ctx.stroke()

          if (magnitude > 0.65) {
            ctx.shadowBlur = 12 + magnitude * 20
            ctx.shadowColor = `hsla(${channel.hue}, 100%, 70%, ${magnitude * 0.6})`
            ctx.stroke()
            ctx.shadowBlur = 0
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

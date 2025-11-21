import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import type { AudioFrame } from '../../state/types'

const SEGMENTS = 8

// Shape definitions for morphing
interface ShapeDefinition {
  name: string
  render: (ctx: CanvasRenderingContext2D, radius: number, frame: AudioFrame, sensitivity: number, seed: number) => void
}

const SHAPES: ShapeDefinition[] = [
  {
    name: 'Frequency Spikes',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const spikes = 24
      const step = Math.floor(frame.frequencyData.length / spikes)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      for (let i = 0; i < spikes; i += 1) {
        const sample = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255
        const length = radius * (0.2 + sample * 0.8 * sensitivity)
        const angle = (i / spikes) * Math.PI
        const x = Math.cos(angle + seed) * length
        const y = Math.sin(angle + seed) * length
        ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = `hsla(${180 + frame.highEnergy * 220}, 70%, 60%, 0.35)`
      ctx.strokeStyle = `hsla(${260 + frame.midEnergy * 150}, 100%, 80%, 0.6)`
      ctx.lineWidth = 1.2
      ctx.fill()
      ctx.stroke()
    }
  },
  {
    name: 'Circular Waves',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const rings = 10
      for (let r = 0; r < rings; r += 1) {
        const ringRadius = (r / rings) * radius
        const freqIndex = Math.floor((r / rings) * frame.frequencyData.length * 0.75)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const alpha = magnitude * sensitivity * 0.6
        
        if (alpha < 0.05) continue
        
        const segments = 32
        ctx.beginPath()
        for (let i = 0; i <= segments; i += 1) {
          const angle = (i / segments) * Math.PI
          const wave = Math.sin(angle * 4 + seed) * magnitude * 10
          const r2 = ringRadius + wave
          const x = Math.cos(angle + seed) * r2
          const y = Math.sin(angle + seed) * r2
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        ctx.strokeStyle = `hsla(${220 + r * 15 + frame.midEnergy * 120}, 90%, 65%, ${alpha})`
        ctx.lineWidth = 1 + magnitude * 3
        ctx.stroke()
      }
    }
  },
  {
    name: 'Geometric Polygons',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const polygons = 6
      for (let p = 0; p < polygons; p += 1) {
        const sides = 4 + p
        const polyRadius = radius * ((p + 1) / polygons) * 0.85
        const freqIndex = Math.floor((p / polygons) * frame.frequencyData.length * 0.7)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 0.8) * sensitivity
        
        if (easedMag < 0.1) continue
        
        ctx.beginPath()
        for (let i = 0; i <= sides; i += 1) {
          const angle = (i / sides) * Math.PI
          const wave = Math.sin(angle * 2 + seed) * easedMag * 15
          const r = polyRadius * (1 + easedMag * 0.3) + wave
          const x = Math.cos(angle) * r
          const y = Math.sin(angle) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        ctx.fillStyle = `hsla(${280 + p * 20 + frame.bassEnergy * 100}, 80%, 58%, ${easedMag * 0.4})`
        ctx.fill()
        ctx.strokeStyle = `hsla(${280 + p * 20 + frame.bassEnergy * 100 + 40}, 95%, 75%, ${easedMag * 0.7})`
        ctx.lineWidth = 1 + easedMag * 2
        ctx.stroke()
      }
    }
  },
  {
    name: 'Star Burst',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const rays = 20
      const step = Math.floor(frame.frequencyData.length / rays)
      
      for (let i = 0; i < rays; i += 1) {
        const sample = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.75) * sensitivity
        
        if (easedSample < 0.15) continue
        
        const angle = (i / rays) * Math.PI + seed
        const length = radius * (0.3 + easedSample * 0.65)
        
        ctx.save()
        ctx.rotate(angle)
        
        ctx.strokeStyle = `hsla(${50 + i * 12 + frame.highEnergy * 180}, 90%, 68%, ${easedSample * 0.8})`
        ctx.lineWidth = 1.5 + easedSample * 4
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, length)
        ctx.stroke()
        
        if (easedSample > 0.5) {
          ctx.fillStyle = `hsla(${50 + i * 12 + frame.highEnergy * 180 + 80}, 100%, 80%, ${easedSample})`
          ctx.beginPath()
          ctx.arc(0, length, 2 + easedSample * 3, 0, Math.PI * 2)
          ctx.fill()
        }
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Mandala Petals',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const petals = 12
      const step = Math.floor(frame.frequencyData.length / petals)
      
      for (let i = 0; i < petals; i += 1) {
        const sample = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.7) * sensitivity
        
        if (easedSample < 0.12) continue
        
        const angle = (i / petals) * Math.PI + seed
        const petalLength = radius * (0.4 + easedSample * 0.55)
        const petalWidth = radius * 0.12 * (0.5 + easedSample * 0.5)
        
        ctx.save()
        ctx.rotate(angle)
        
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(petalWidth, petalLength * 0.5, 0, petalLength)
        ctx.quadraticCurveTo(-petalWidth, petalLength * 0.5, 0, 0)
        ctx.closePath()
        
        ctx.fillStyle = `hsla(${180 + i * 18 + frame.midEnergy * 140}, 85%, 62%, ${easedSample * 0.6})`
        ctx.fill()
        
        ctx.strokeStyle = `hsla(${180 + i * 18 + frame.midEnergy * 140 + 60}, 100%, 78%, ${easedSample * 0.7})`
        ctx.lineWidth = 0.8 + easedSample * 1.5
        ctx.stroke()
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Spiral Arms',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const arms = 16
      const step = Math.floor(frame.frequencyData.length / arms)
      
      for (let i = 0; i < arms; i += 1) {
        const sample = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.85) * sensitivity
        
        if (easedSample < 0.1) continue
        
        const baseAngle = (i / arms) * Math.PI + seed
        const segments = 8
        
        ctx.beginPath()
        for (let s = 0; s <= segments; s += 1) {
          const t = s / segments
          const angle = baseAngle + t * Math.PI * 0.5
          const r = radius * t * (0.3 + easedSample * 0.7)
          const wave = Math.sin(s * 2 + seed) * easedSample * 12
          const x = Math.cos(angle) * (r + wave)
          const y = Math.sin(angle) * (r + wave)
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        
        ctx.strokeStyle = `hsla(${140 + i * 10 + frame.highEnergy * 160}, 88%, 66%, ${easedSample * 0.75})`
        ctx.lineWidth = 1.2 + easedSample * 3
        ctx.stroke()
      }
    }
  }
]

function KaleidoscopeMirror({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shapeIndexRef = useRef(0)
  const shapeTimerRef = useRef(0)
  const nextShapeTimeRef = useRef(8 + Math.random() * 12) // 8-20 seconds

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame, time) => {
      const { width, height } = dims
      ctx.fillStyle = 'rgba(5,6,10,0.4)'
      ctx.fillRect(0, 0, width, height)

      const radius = Math.min(width, height) * 0.6
      const angleStep = (Math.PI * 2) / SEGMENTS
      const rotation = frame.bassEnergy * Math.PI * sensitivity + time * 0.0002

      // Shape morphing system
      shapeTimerRef.current += 0.016 // ~60fps
      
      if (shapeTimerRef.current >= nextShapeTimeRef.current) {
        shapeIndexRef.current = Math.floor(Math.random() * SHAPES.length)
        shapeTimerRef.current = 0
        nextShapeTimeRef.current = 8 + Math.random() * 12 // Random 8-20 seconds
      }

      const currentShape = SHAPES[shapeIndexRef.current]

      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate(rotation)

      for (let i = 0; i < SEGMENTS; i += 1) {
        ctx.save()
        ctx.rotate(angleStep * i)
        currentShape.render(ctx, radius, frame, sensitivity, i)
        ctx.scale(1, -1)
        currentShape.render(ctx, radius, frame, sensitivity, i + 0.5)
        ctx.restore()
      }

      ctx.restore()
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/20" />
}

export default KaleidoscopeMirror

import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient, createLinearGradient } from '../utils/colors'
import { easeAudio } from '../utils/audio'
import { applyGlow, clearGlow } from '../utils/shapes'
import { EASING_CURVES } from '../constants'

// Flowing neural network with natural connections across the screen
interface Neuron {
  x: number
  y: number
  vx: number
  vy: number
  activation: number
  peakActivation: number
  frequency: number
  size: number
  hue: number
  connections: number[]
  pulses: Array<{ targetId: number; progress: number; strength: number }>
}

const NEURON_COUNT = 150

export function NeuralNetwork({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const neuronsRef = useRef<Neuron[]>([])
  const timeRef = useRef(0)

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      timeRef.current += 0.016

      // Initialize flowing neurons
      if (neuronsRef.current.length === 0) {
        for (let i = 0; i < NEURON_COUNT; i++) {
          // Distribute naturally across screen with some clustering
          const clusterX = (Math.random() * 3) | 0
          const clusterY = (Math.random() * 2) | 0
          const baseX = (clusterX / 3) * width + (Math.random() - 0.5) * width * 0.3
          const baseY = (clusterY / 2) * height + (Math.random() - 0.5) * height * 0.4

          neuronsRef.current.push({
            x: Math.max(50, Math.min(width - 50, baseX)),
            y: Math.max(50, Math.min(height - 50, baseY)),
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            activation: 0,
            peakActivation: 0,
            frequency: Math.random(),
            size: 2 + Math.random() * 3,
            hue: Math.random() * 360,
            connections: [],
            pulses: [],
          })
        }

        // Create natural connections (connect to nearby neurons)
        neuronsRef.current.forEach((neuron, idx) => {
          const connectionCount = 3 + Math.floor(Math.random() * 4)
          const distances: Array<{ id: number; dist: number }> = []

          neuronsRef.current.forEach((other, otherId) => {
            if (idx === otherId) return
            const dx = other.x - neuron.x
            const dy = other.y - neuron.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            distances.push({ id: otherId, dist })
          })

          // Connect to nearest neighbors
          distances.sort((a, b) => a.dist - b.dist)
          for (let c = 0; c < connectionCount && c < distances.length; c++) {
            if (distances[c].dist < Math.min(width, height) * 0.3) {
              neuron.connections.push(distances[c].id)
            }
          }
        })
      }

      // Deep background
      ctx.fillStyle = 'rgba(0, 0, 10, 0.15)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, 0.68) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, 0.78) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Update neurons with natural movement
      neuronsRef.current.forEach((neuron, id) => {
        // Frequency-based activation
        const freqIndex = Math.floor(neuron.frequency * frame.frequencyData.length * 0.85)
        const magnitude = frame.frequencyData[freqIndex] / 255

        // Audio-reactive activation
        const audioInfluence = magnitude * sensitivity * (1 + midEnergy * 0.6)
        neuron.activation = Math.max(neuron.activation * 0.92, audioInfluence * 1.8)
        neuron.peakActivation = Math.max(neuron.peakActivation * 0.96, neuron.activation)

        // Natural floating motion
        neuron.vx += (Math.random() - 0.5) * 0.08 + Math.sin(timeRef.current * 0.5 + id) * 0.02
        neuron.vy += (Math.random() - 0.5) * 0.08 + Math.cos(timeRef.current * 0.5 + id) * 0.02

        // Flow field influence
        const flowAngle = Math.sin(neuron.x * 0.008 + timeRef.current) + Math.cos(neuron.y * 0.008 + timeRef.current)
        neuron.vx += Math.cos(flowAngle) * midEnergy * 0.15
        neuron.vy += Math.sin(flowAngle) * midEnergy * 0.15

        // Attraction to nearby activated neurons
        neuronsRef.current.forEach((other, otherId) => {
          if (id === otherId || other.activation < 0.4) return
          const dx = other.x - neuron.x
          const dy = other.y - neuron.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 200 && dist > 10) {
            const force = other.activation * 0.015
            neuron.vx += (dx / dist) * force
            neuron.vy += (dy / dist) * force
          }
        })

        // Update position
        neuron.x += neuron.vx
        neuron.y += neuron.vy

        // Friction
        neuron.vx *= 0.98
        neuron.vy *= 0.98

        // Wrap around with soft boundaries
        const margin = 30
        if (neuron.x < margin) {
          neuron.x = margin
          neuron.vx *= -0.5
        }
        if (neuron.x > width - margin) {
          neuron.x = width - margin
          neuron.vx *= -0.5
        }
        if (neuron.y < margin) {
          neuron.y = margin
          neuron.vy *= -0.5
        }
        if (neuron.y > height - margin) {
          neuron.y = height - margin
          neuron.vy *= -0.5
        }

        // Generate pulses on high activation
        if (neuron.activation > 0.65 && Math.random() > 0.92) {
          neuron.connections.forEach((targetId) => {
            if (Math.random() > 0.6) {
              neuron.pulses.push({
                targetId: targetId,
                progress: 0,
                strength: neuron.activation,
              })
            }
          })
        }

        // Update pulses
        neuron.pulses = neuron.pulses.filter((pulse) => {
          pulse.progress += 0.02 + highEnergy * 0.02
          return pulse.progress < 1
        })

        // Update hue
        neuron.hue = (neuron.hue + magnitude * 0.6 + 0.15) % 360
      })

      // Render connections
      neuronsRef.current.forEach((neuron) => {
        if (neuron.activation < 0.2 && neuron.peakActivation < 0.3) return

        neuron.connections.forEach((targetId) => {
          const target = neuronsRef.current[targetId]
          if (!target) return

          const dx = target.x - neuron.x
          const dy = target.y - neuron.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          // Only render nearby connections
          if (dist > 400) return

          const combinedActivation = (neuron.activation + target.activation) / 2
          if (combinedActivation < 0.15) return

          const alpha = combinedActivation * (1 - dist / 400) * 0.7

          if (alpha < 0.05) return

          // Gradient connection line
          const avgHue = (neuron.hue + target.hue) / 2
          const gradient = createLinearGradient(ctx, neuron.x, neuron.y, target.x, target.y, [
            { offset: 0, color: hsl(neuron.hue, 88, 65, alpha) },
            { offset: 0.5, color: hsl(avgHue, 92, 70, alpha * 1.2) },
            { offset: 1, color: hsl(target.hue, 88, 65, alpha) },
          ])

          ctx.strokeStyle = gradient
          ctx.lineWidth = 0.8 + combinedActivation * 2.5
          ctx.lineCap = 'round'

          // Add glow for high activation
          if (combinedActivation > 0.6) {
            applyGlow(ctx, hsl(avgHue, 90, 70, alpha * 0.8), 8)
          }

          ctx.beginPath()
          ctx.moveTo(neuron.x, neuron.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
          clearGlow(ctx)
        })

        // Render pulses
        neuron.pulses.forEach((pulse) => {
          const target = neuronsRef.current[pulse.targetId]
          if (!target) return

          const px = neuron.x + (target.x - neuron.x) * pulse.progress
          const py = neuron.y + (target.y - neuron.y) * pulse.progress
          const pulseSize = 3 + pulse.strength * 8

          const gradient = createRadialGradient(ctx, px, py, 0, pulseSize * 2, [
            { offset: 0, color: hsl(neuron.hue + 180, 100, 88, pulse.strength * (1 - pulse.progress * 0.5)) },
            { offset: 0.5, color: hsl(neuron.hue + 200, 95, 78, pulse.strength * (1 - pulse.progress * 0.5) * 0.7) },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ])

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(px, py, pulseSize * 2, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      // Render neurons
      neuronsRef.current.forEach((neuron) => {
        const displayActivation = Math.max(neuron.activation, neuron.peakActivation * 0.6)
        if (displayActivation < 0.15) return

        const renderSize = neuron.size * (1 + displayActivation * 1.5)

        // Outer glow
        const glowGradient = createRadialGradient(ctx, neuron.x, neuron.y, 0, renderSize * 3.5, [
          { offset: 0, color: hsl(neuron.hue, 100, 80, displayActivation * 0.9) },
          { offset: 0.4, color: hsl(neuron.hue + 40, 95, 70, displayActivation * 0.6) },
          { offset: 0.7, color: hsl(neuron.hue + 80, 90, 60, displayActivation * 0.3) },
          { offset: 1, color: 'rgba(0,0,0,0)' },
        ])

        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(neuron.x, neuron.y, renderSize * 3.5, 0, Math.PI * 2)
        ctx.fill()

        // Core
        if (displayActivation > 0.5) {
          applyGlow(ctx, hsl(neuron.hue, 100, 80, displayActivation), 10)
          ctx.fillStyle = hsl(neuron.hue, 100, 90, displayActivation)
          ctx.beginPath()
          ctx.arc(neuron.x, neuron.y, renderSize, 0, Math.PI * 2)
          ctx.fill()
          clearGlow(ctx)
        }
      })

      // Energy field visualization
      if (midEnergy > 0.5) {
        const fieldLines = 8
        ctx.strokeStyle = hsl(timeRef.current * 80 + 200, 75, 60, midEnergy * 0.15)
        ctx.lineWidth = 1
        ctx.setLineDash([8, 12])

        for (let i = 0; i < fieldLines; i++) {
          const y = (i / fieldLines) * height
          ctx.beginPath()
          for (let x = 0; x < width; x += 20) {
            const wave = Math.sin(x * 0.01 + timeRef.current + i) * 30
            if (x === 0) ctx.moveTo(x, y + wave)
            else ctx.lineTo(x, y + wave)
          }
          ctx.stroke()
        }
        ctx.setLineDash([])
      }

      // Burst effect on high bass
      if (bassEnergy > 0.75) {
        const burstCount = 12
        const burstRadius = Math.min(width, height) * 0.25 + bassEnergy * 100

        for (let b = 0; b < burstCount; b++) {
          const angle = (b / burstCount) * Math.PI * 2 + timeRef.current * 2
          const x = width / 2 + Math.cos(angle) * burstRadius
          const y = height / 2 + Math.sin(angle) * burstRadius

          const burstGradient = createRadialGradient(ctx, x, y, 0, 15, [
            { offset: 0, color: hsl(timeRef.current * 120 + b * 30, 100, 85, bassEnergy) },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ])

          ctx.fillStyle = burstGradient
          ctx.beginPath()
          ctx.arc(x, y, 15, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

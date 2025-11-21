import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// 2D Neural Network with flowing signals
interface Neuron {
  x: number
  y: number
  vx: number
  vy: number
  connections: number[]
  activation: number
  layer: number
  hue: number
}

interface Signal {
  from: number
  to: number
  progress: number
  strength: number
}

function NeuralNetwork({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const neuronsRef = useRef<Neuron[]>([])
  const signalsRef = useRef<Signal[]>([])
  const timeRef = useRef(0)
  const initialized = useRef(false)

  const NEURON_COUNT = 80
  const LAYERS = 5

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      timeRef.current += 0.016

      // Initialize neurons once
      if (!initialized.current && width > 0 && height > 0) {
        const layerWidth = width / (LAYERS + 1)
        neuronsRef.current = []
        
        for (let layer = 0; layer < LAYERS; layer++) {
          const neuronsInLayer = Math.floor(NEURON_COUNT / LAYERS)
          for (let n = 0; n < neuronsInLayer; n++) {
            const x = layerWidth * (layer + 1)
            const y = (height / (neuronsInLayer + 1)) * (n + 1) + (Math.random() - 0.5) * 30
            neuronsRef.current.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              connections: [],
              activation: 0,
              layer,
              hue: (layer / LAYERS + n * 0.05) % 1,
            })
          }
        }

        // Create connections (prefer next layer)
        neuronsRef.current.forEach((neuron) => {
          const connectionsCount = 2 + Math.floor(Math.random() * 3)
          for (let j = 0; j < connectionsCount; j++) {
            const targetLayer = neuron.layer + 1
            if (targetLayer < LAYERS) {
              const targets = neuronsRef.current
                .map((n, idx) => ({ n, idx }))
                .filter(({ n }) => n.layer === targetLayer)
              if (targets.length > 0) {
                const target = targets[Math.floor(Math.random() * targets.length)]
                neuron.connections.push(target.idx)
              }
            }
          }
        })
        
        initialized.current = true
      }

      // Background
      ctx.fillStyle = theme === 'dark' ? 'rgba(0, 0, 5, 0.15)' : 'rgba(255, 255, 255, 0.15)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Trigger neuron firing based on audio
      if (neuronsRef.current.length > 0) {
        const bassIdx = Math.floor(bassEnergy * neuronsRef.current.length * 0.3)
        const midIdx = Math.floor((0.3 + midEnergy * 0.4) * neuronsRef.current.length)
        const highIdx = Math.floor((0.7 + highEnergy * 0.3) * neuronsRef.current.length)

        if (bassEnergy > 0.3 && neuronsRef.current[bassIdx]) {
          fireNeuron(bassIdx, bassEnergy)
        }
        if (midEnergy > 0.3 && neuronsRef.current[midIdx]) {
          fireNeuron(midIdx, midEnergy)
        }
        if (highEnergy > 0.4 && neuronsRef.current[highIdx]) {
          fireNeuron(highIdx, highEnergy)
        }
      }

      // Draw connections
      ctx.lineWidth = 1
      neuronsRef.current.forEach((neuron) => {
        neuron.connections.forEach(targetIdx => {
          const target = neuronsRef.current[targetIdx]
          if (target) {
            const alpha = 0.1 + neuron.activation * 0.3
            ctx.beginPath()
            ctx.moveTo(neuron.x, neuron.y)
            ctx.lineTo(target.x, target.y)
            ctx.strokeStyle = `hsla(${neuron.hue * 360}, 70%, 60%, ${alpha})`
            ctx.stroke()
          }
        })
      })

      // Update and draw neurons
      neuronsRef.current.forEach((neuron) => {
        // Decay activation
        neuron.activation *= 0.95

        // Floating motion
        neuron.x += neuron.vx
        neuron.y += neuron.vy
        neuron.vx += (Math.random() - 0.5) * 0.1
        neuron.vy += (Math.random() - 0.5) * 0.1
        neuron.vx *= 0.95
        neuron.vy *= 0.95

        // Boundaries
        const margin = 20
        if (neuron.x < margin || neuron.x > width - margin) neuron.vx *= -0.8
        if (neuron.y < margin || neuron.y > height - margin) neuron.vy *= -0.8
        neuron.x = Math.max(margin, Math.min(width - margin, neuron.x))
        neuron.y = Math.max(margin, Math.min(height - margin, neuron.y))

        // Draw neuron
        const size = 3 + neuron.activation * 8
        const hue = (neuron.hue + timeRef.current * 0.02) % 1
        
        ctx.beginPath()
        ctx.arc(neuron.x, neuron.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue * 360}, 80%, ${50 + neuron.activation * 30}%, ${0.7 + neuron.activation * 0.3})`
        ctx.shadowBlur = 10 + neuron.activation * 20
        ctx.shadowColor = `hsla(${hue * 360}, 100%, 70%, ${neuron.activation})`
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Update and draw signals
      const activeSignals: Signal[] = []
      signalsRef.current.forEach(signal => {
        signal.progress += 0.02 * (1 + highEnergy)

        if (signal.progress < 1) {
          const from = neuronsRef.current[signal.from]
          const to = neuronsRef.current[signal.to]
          if (from && to) {
            const x = from.x + (to.x - from.x) * signal.progress
            const y = from.y + (to.y - from.y) * signal.progress

            ctx.beginPath()
            ctx.arc(x, y, 3 + signal.strength * 3, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${from.hue * 360}, 90%, 70%, ${(1 - signal.progress) * 0.9})`
            ctx.shadowBlur = 15
            ctx.shadowColor = `hsla(${from.hue * 360}, 100%, 80%, 0.8)`
            ctx.fill()
            ctx.shadowBlur = 0

            activeSignals.push(signal)
          }
        } else {
          // Activate target neuron
          const target = neuronsRef.current[signal.to]
          if (target) {
            target.activation = Math.min(1, target.activation + signal.strength * 0.8)
            // Propagate
            if (Math.random() < 0.4) {
              fireNeuron(signal.to, signal.strength * 0.6)
            }
          }
        }
      })
      signalsRef.current = activeSignals
    },
    [sensitivity, theme],
  )

  function fireNeuron(index: number, strength: number) {
    const neuron = neuronsRef.current[index]
    if (!neuron) return

    neuron.activation = Math.min(1, strength)
    
    // Send signals to connected neurons
    neuron.connections.forEach(targetIdx => {
      signalsRef.current.push({
        from: index,
        to: targetIdx,
        progress: 0,
        strength: strength * 0.8,
      })
    })
  }

  return <canvas ref={canvasRef} className="block w-full rounded-3xl" style={{ height: '420px', maxHeight: '420px' }} />
}

export default NeuralNetwork

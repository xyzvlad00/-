import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

interface Neuron {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  activation: number
  targetActivation: number
  connections: number[]
  layer: number
}

function NeuralNetwork({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const neuronsRef = useRef<Neuron[]>([])
  const timeRef = useRef(0)
  const pulseRef = useRef<Array<{ from: number; to: number; progress: number; speed: number; color: number }>>([])

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      timeRef.current += 0.016

      // Clear with trail effect
      ctx.fillStyle = theme === 'dark' ? 'rgba(0, 2, 8, 0.12)' : 'rgba(240, 240, 250, 0.12)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Initialize neurons in 3D space with layers
      if (neuronsRef.current.length === 0) {
        const layers = 6
        const neuronsPerLayer = [8, 16, 24, 24, 16, 8] // Hourglass shape
        let id = 0

        for (let layer = 0; layer < layers; layer++) {
          const count = neuronsPerLayer[layer]
          const layerZ = (layer / (layers - 1)) * 800 - 400 // -400 to +400
          
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2
            const radius = 150 + Math.random() * 100
            
            neuronsRef.current.push({
              x: Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
              y: Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
              z: layerZ + (Math.random() - 0.5) * 100,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              vz: (Math.random() - 0.5) * 0.5,
              activation: Math.random(),
              targetActivation: 0,
              connections: [],
              layer: layer,
            })
            id++
          }
        }

        // Create connections between adjacent layers and some within layers
        neuronsRef.current.forEach((neuron, i) => {
          neuronsRef.current.forEach((other, j) => {
            if (i !== j) {
              const layerDiff = Math.abs(neuron.layer - other.layer)
              const dx = neuron.x - other.x
              const dy = neuron.y - other.y
              const dz = neuron.z - other.z
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
              
              // Connect to adjacent layers or nearby neurons
              if ((layerDiff === 1 && Math.random() > 0.3) || (layerDiff === 0 && dist < 200 && Math.random() > 0.7)) {
                neuron.connections.push(j)
              }
            }
          })
        })
      }

      // Update neuron activations based on audio
      const neurons = neuronsRef.current
      neurons.forEach((neuron, i) => {
        const freqIndex = Math.floor((i / neurons.length) * frame.frequencyData.length)
        const audioValue = frame.frequencyData[freqIndex] / 255
        
        // Different layers respond to different frequencies
        let energyBoost = 0
        if (neuron.layer < 2) energyBoost = bassEnergy * 1.5
        else if (neuron.layer < 4) energyBoost = midEnergy * 1.2
        else energyBoost = highEnergy * 1.0
        
        neuron.targetActivation = audioValue * 0.7 + energyBoost * 0.3
        neuron.activation += (neuron.targetActivation - neuron.activation) * 0.1

        // Add motion to neurons
        neuron.vx += (Math.random() - 0.5) * 0.2
        neuron.vy += (Math.random() - 0.5) * 0.2
        neuron.vz += (Math.random() - 0.5) * 0.2
        neuron.vx *= 0.95
        neuron.vy *= 0.95
        neuron.vz *= 0.95

        neuron.x += neuron.vx + Math.sin(timeRef.current * 0.5 + i) * (bassEnergy * 2)
        neuron.y += neuron.vy + Math.cos(timeRef.current * 0.5 + i) * (bassEnergy * 2)
        neuron.z += neuron.vz + Math.sin(timeRef.current * 0.3 + i * 0.1) * (midEnergy * 3)

        // Keep neurons loosely bounded
        const centerPull = 0.003
        neuron.vx -= neuron.x * centerPull
        neuron.vy -= neuron.y * centerPull
        neuron.vz -= neuron.z * centerPull
      })

      // Create new pulses
      if (Math.random() < 0.1 + highEnergy * 0.3) {
        const fromIdx = Math.floor(Math.random() * neurons.length)
        const fromNeuron = neurons[fromIdx]
        if (fromNeuron.connections.length > 0) {
          const toIdx = fromNeuron.connections[Math.floor(Math.random() * fromNeuron.connections.length)]
          pulseRef.current.push({
            from: fromIdx,
            to: toIdx,
            progress: 0,
            speed: 0.02 + highEnergy * 0.03,
            color: Math.random() * 360,
          })
        }
      }

      // Camera/projection setup
      const fov = 800
      const cameraZ = -600 - Math.sin(timeRef.current * 0.3) * 200
      const cameraRotation = timeRef.current * 0.2

      // Project and sort neurons by depth
      const projected = neurons.map((neuron, i) => {
        // Rotate around Y axis
        const rotX = neuron.x * Math.cos(cameraRotation) - neuron.z * Math.sin(cameraRotation)
        const rotZ = neuron.x * Math.sin(cameraRotation) + neuron.z * Math.cos(cameraRotation)
        
        const z = rotZ - cameraZ
        const scale = fov / (fov + z)
        const x2d = rotX * scale + width / 2
        const y2d = neuron.y * scale + height / 2
        
        return { neuron, i, x2d, y2d, z, scale, rotX, rotZ }
      })

      projected.sort((a, b) => a.z - b.z)

      // Draw connections first (behind neurons)
      ctx.globalCompositeOperation = 'lighter'
      projected.forEach(({ neuron, x2d, y2d, z, scale }) => {
        neuron.connections.forEach((connIdx) => {
          const otherProj = projected.find(p => p.i === connIdx)
          if (!otherProj) return

          const dist = Math.sqrt(
            Math.pow(x2d - otherProj.x2d, 2) + 
            Math.pow(y2d - otherProj.y2d, 2)
          )
          
          if (dist > 500) return // Don't draw very long connections

          const avgActivation = (neuron.activation + otherProj.neuron.activation) / 2
          const avgZ = (z + otherProj.z) / 2
          const depthOpacity = Math.max(0, 1 - avgZ / 1000)
          
          const gradient = ctx.createLinearGradient(x2d, y2d, otherProj.x2d, otherProj.y2d)
          const hue1 = (neuron.layer * 60) % 360
          const hue2 = (otherProj.neuron.layer * 60) % 360
          
          gradient.addColorStop(0, hsl(hue1, 80, 50 + avgActivation * 30, avgActivation * 0.3 * depthOpacity))
          gradient.addColorStop(0.5, hsl((hue1 + hue2) / 2, 85, 55 + avgActivation * 35, avgActivation * 0.5 * depthOpacity))
          gradient.addColorStop(1, hsl(hue2, 80, 50 + avgActivation * 30, avgActivation * 0.3 * depthOpacity))
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = (1 + avgActivation * 3) * scale
            ctx.beginPath()
          ctx.moveTo(x2d, y2d)
          ctx.lineTo(otherProj.x2d, otherProj.y2d)
            ctx.stroke()
        })
      })

      // Draw pulses traveling along connections
      pulseRef.current = pulseRef.current.filter((pulse) => {
        pulse.progress += pulse.speed
        if (pulse.progress > 1) return false

        const fromProj = projected.find(p => p.i === pulse.from)
        const toProj = projected.find(p => p.i === pulse.to)
        if (!fromProj || !toProj) return false

        const pulseX = fromProj.x2d + (toProj.x2d - fromProj.x2d) * pulse.progress
        const pulseY = fromProj.y2d + (toProj.y2d - fromProj.y2d) * pulse.progress
        const pulseZ = fromProj.z + (toProj.z - fromProj.z) * pulse.progress
        const pulseScale = fov / (fov + pulseZ)
        const depthOpacity = Math.max(0, 1 - pulseZ / 1000)

        const size = (8 + Math.sin(pulse.progress * Math.PI) * 12) * pulseScale

        const pulseGrad = createRadialGradient(ctx, pulseX, pulseY, 0, size * 2, [
          { offset: 0, color: hsl(pulse.color, 100, 85, 0.9 * depthOpacity) },
          { offset: 0.5, color: hsl(pulse.color + 30, 95, 75, 0.6 * depthOpacity) },
          { offset: 1, color: hsl(pulse.color + 60, 90, 65, 0) },
        ])
        
        ctx.fillStyle = pulseGrad
        ctx.beginPath()
        ctx.arc(pulseX, pulseY, size * 2, 0, Math.PI * 2)
        ctx.fill()

        return true
      })

      // Draw neurons on top
      projected.forEach(({ neuron, x2d, y2d, z, scale }) => {
        const depthOpacity = Math.max(0, 1 - z / 1000)
        const size = (6 + neuron.activation * 18) * scale
        const hue = (neuron.layer * 60 + timeRef.current * 20) % 360

        // Glow
        const glowGrad = createRadialGradient(ctx, x2d, y2d, 0, size * 3, [
          { offset: 0, color: hsl(hue, 100, 75, (0.6 + neuron.activation * 0.4) * depthOpacity) },
          { offset: 0.4, color: hsl(hue, 95, 65, (0.4 + neuron.activation * 0.4) * depthOpacity) },
          { offset: 1, color: hsl(hue, 90, 55, 0) },
        ])
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(x2d, y2d, size * 3, 0, Math.PI * 2)
        ctx.fill()

        // Core
        const coreGrad = createRadialGradient(ctx, x2d, y2d, 0, size, [
          { offset: 0, color: hsl(hue, 100, 95, depthOpacity) },
          { offset: 0.6, color: hsl(hue, 95, 75 + neuron.activation * 20, (0.9 + neuron.activation * 0.1) * depthOpacity) },
          { offset: 1, color: hsl(hue, 90, 60 + neuron.activation * 25, (0.7 + neuron.activation * 0.3) * depthOpacity) },
        ])
        ctx.fillStyle = coreGrad
            ctx.beginPath()
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2)
            ctx.fill()

        // Extra bright center for highly activated neurons
        if (neuron.activation > 0.7) {
          ctx.fillStyle = hsl(hue, 100, 99, depthOpacity)
          ctx.beginPath()
          ctx.arc(x2d, y2d, size * 0.4, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      ctx.globalCompositeOperation = 'source-over'

      // Info overlay
      ctx.shadowBlur = 0
      ctx.fillStyle = theme === 'dark' ? 'rgba(100, 200, 255, 0.9)' : 'rgba(0, 50, 100, 0.9)'
      ctx.font = 'bold 18px monospace'
      ctx.textAlign = 'left'
      
      const avgActivation = neurons.reduce((sum, n) => sum + n.activation, 0) / neurons.length
      const activeCount = neurons.filter(n => n.activation > 0.5).length
      
      ctx.fillText(`⚡ ${neurons.length} neurons`, 20, 30)
      ctx.fillText(`🔥 ${activeCount} active`, 20, 55)
      ctx.fillText(`📊 ${(avgActivation * 100).toFixed(0)}% avg`, 20, 80)
    },
    [sensitivity, theme],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

export default NeuralNetwork

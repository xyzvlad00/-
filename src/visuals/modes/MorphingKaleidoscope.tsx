import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import type { AudioFrame } from '../../state/types'

const SEGMENTS = 8

interface ShapeDefinition {
  name: string
  render: (ctx: CanvasRenderingContext2D, radius: number, frame: AudioFrame, sensitivity: number, seed: number) => void
}

const SHAPES: ShapeDefinition[] = [
  // Standard Geometric Shapes (14)
  {
    name: 'Frequency Spikes',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const spikes = 32
      const step = Math.floor(frame.frequencyData.length / spikes)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      for (let i = 0; i < spikes; i += 1) {
        const sample = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255
        const length = radius * (0.15 + sample * 0.85 * sensitivity)
        const angle = (i / spikes) * Math.PI
        const x = Math.cos(angle + seed) * length
        const y = Math.sin(angle + seed) * length
        ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = `hsla(${180 + frame.highEnergy * 220}, 75%, 62%, 0.4)`
      ctx.strokeStyle = `hsla(${260 + frame.midEnergy * 150}, 100%, 80%, 0.65)`
      ctx.lineWidth = 1.5
      ctx.fill()
      ctx.stroke()
    }
  },
  {
    name: 'Nested Polygons',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const layers = 8
      for (let layer = 0; layer < layers; layer++) {
        const sides = 3 + layer
        const polyRadius = radius * ((layer + 1) / layers) * 0.88
        const freqIndex = Math.floor((layer / layers) * frame.frequencyData.length * 0.75)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 0.82) * sensitivity
        
        if (easedMag < 0.08) continue
        
        ctx.save()
        ctx.rotate(seed + easedMag * Math.PI * 0.3)
        
        ctx.beginPath()
        for (let i = 0; i <= sides; i++) {
          const angle = (i / sides) * Math.PI
          const x = Math.cos(angle) * polyRadius * (1 + easedMag * 0.25)
          const y = Math.sin(angle) * polyRadius * (1 + easedMag * 0.25)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        ctx.strokeStyle = `hsla(${40 + layer * 35 + frame.bassEnergy * 120}, 88%, 70%, ${easedMag * 0.8})`
        ctx.lineWidth = 1.2 + easedMag * 2.5
        ctx.stroke()
        
        if (easedMag > 0.55) {
          ctx.fillStyle = `hsla(${40 + layer * 35 + frame.bassEnergy * 120}, 82%, 62%, ${easedMag * 0.35})`
          ctx.fill()
        }
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Hexagonal Honeycomb',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const rings = 6
      for (let ring = 1; ring <= rings; ring++) {
        const hexCount = ring * 6
        const ringRadius = (ring / rings) * radius * 0.85
        const freqIndex = Math.floor((ring / rings) * frame.frequencyData.length * 0.8)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 0.85) * sensitivity
        
        if (easedMag < 0.1) continue
        
        for (let h = 0; h < hexCount; h++) {
          const angle = (h / hexCount) * Math.PI * 2 + seed
          const hexSize = 6 + easedMag * 18
          const cx = Math.cos(angle) * ringRadius
          const cy = Math.sin(angle) * ringRadius
          
          ctx.beginPath()
          for (let s = 0; s < 6; s++) {
            const sAngle = (s / 6) * Math.PI * 2 + angle * 0.5
            const sx = cx + Math.cos(sAngle) * hexSize
            const sy = cy + Math.sin(sAngle) * hexSize
            if (s === 0) ctx.moveTo(sx, sy)
            else ctx.lineTo(sx, sy)
          }
          ctx.closePath()
          
          ctx.strokeStyle = `hsla(${180 + ring * 30 + frame.midEnergy * 100}, 90%, 68%, ${easedMag * 0.7})`
          ctx.lineWidth = 0.9
          ctx.stroke()
        }
      }
    }
  },
  {
    name: 'Triangular Grid',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const triangles = 18
      const step = Math.floor(frame.frequencyData.length / triangles)
      
      for (let t = 0; t < triangles; t++) {
        const sample = frame.frequencyData[Math.min(t * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.78) * sensitivity
        
        if (easedSample < 0.1) continue
        
        const angle = (t / triangles) * Math.PI * 2 + seed
        const triRadius = radius * (0.25 + easedSample * 0.65)
        
        ctx.save()
        ctx.rotate(angle)
        
        ctx.beginPath()
        for (let v = 0; v < 3; v++) {
          const vAngle = (v / 3) * Math.PI * 2
          const x = Math.cos(vAngle) * triRadius
          const y = Math.sin(vAngle) * triRadius
          if (v === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        ctx.fillStyle = `hsla(${280 + t * 15 + frame.bassEnergy * 130}, 84%, 64%, ${easedSample * 0.42})`
        ctx.fill()
        ctx.strokeStyle = `hsla(${280 + t * 15 + frame.bassEnergy * 130 + 50}, 96%, 76%, ${easedSample * 0.78})`
        ctx.lineWidth = 1.3 + easedSample * 2.2
        ctx.stroke()
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Rotating Squares',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const squares = 9
      for (let sq = 0; sq < squares; sq++) {
        const freqIndex = Math.floor((sq / squares) * frame.frequencyData.length * 0.72)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 0.88) * sensitivity
        
        if (easedMag < 0.08) continue
        
        const squareSize = ((sq + 1) / squares) * radius * 0.87 * (1 + easedMag * 0.28)
        const rotation = seed + easedMag * Math.PI * 0.6 + sq * 0.3
        
        ctx.save()
        ctx.rotate(rotation)
        
        ctx.beginPath()
        ctx.rect(-squareSize, -squareSize, squareSize * 2, squareSize * 2)
        
        ctx.strokeStyle = `hsla(${60 + sq * 32 + frame.midEnergy * 140}, 87%, 67%, ${easedMag * 0.82})`
        ctx.lineWidth = 1.4 + easedMag * 2.8
        ctx.stroke()
        
        if (easedMag > 0.52) {
          ctx.fillStyle = `hsla(${60 + sq * 32 + frame.midEnergy * 140}, 80%, 60%, ${easedMag * 0.32})`
          ctx.fill()
        }
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Star Points',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const points = 24
      const step = Math.floor(frame.frequencyData.length / points)
      
      for (let i = 0; i < points; i++) {
        const sample = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.76) * sensitivity
        
        if (easedSample < 0.12) continue
        
        const angle = (i / points) * Math.PI + seed
        const length = radius * (0.28 + easedSample * 0.68)
        
        ctx.save()
        ctx.rotate(angle)
        
        const gradient = ctx.createLinearGradient(0, 0, 0, length)
        gradient.addColorStop(0, `hsla(${45 + i * 12 + frame.highEnergy * 180}, 92%, 70%, ${easedSample * 0.6})`)
        gradient.addColorStop(1, `hsla(${45 + i * 12 + frame.highEnergy * 180 + 80}, 100%, 82%, ${easedSample * 0.9})`)
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.8 + easedSample * 4.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, length)
        ctx.stroke()
        
        if (easedSample > 0.58) {
          ctx.fillStyle = `hsla(${45 + i * 12 + frame.highEnergy * 180 + 120}, 100%, 88%, ${easedSample * 0.95})`
          ctx.beginPath()
          ctx.arc(0, length, 2.5 + easedSample * 4, 0, Math.PI * 2)
          ctx.fill()
        }
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Petal Mandala',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const petals = 16
      const step = Math.floor(frame.frequencyData.length / petals)
      
      for (let i = 0; i < petals; i++) {
        const sample = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.72) * sensitivity
        
        if (easedSample < 0.1) continue
        
        const angle = (i / petals) * Math.PI + seed
        const petalLength = radius * (0.38 + easedSample * 0.58)
        const petalWidth = radius * 0.14 * (0.48 + easedSample * 0.52)
        
        ctx.save()
        ctx.rotate(angle)
        
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(petalWidth, petalLength * 0.48, 0, petalLength)
        ctx.quadraticCurveTo(-petalWidth, petalLength * 0.48, 0, 0)
        ctx.closePath()
        
        ctx.fillStyle = `hsla(${160 + i * 18 + frame.midEnergy * 140}, 86%, 64%, ${easedSample * 0.58})`
        ctx.fill()
        
        ctx.strokeStyle = `hsla(${160 + i * 18 + frame.midEnergy * 140 + 65}, 100%, 80%, ${easedSample * 0.75})`
        ctx.lineWidth = 0.9 + easedSample * 1.8
        ctx.stroke()
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Diamond Lattice',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const diamonds = 20
      const step = Math.floor(frame.frequencyData.length / diamonds)
      
      for (let d = 0; d < diamonds; d++) {
        const sample = frame.frequencyData[Math.min(d * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.81) * sensitivity
        
        if (easedSample < 0.09) continue
        
        const angle = (d / diamonds) * Math.PI * 2 + seed
        const distance = radius * (0.28 + (d / diamonds) * 0.62)
        const diamondSize = 8 + easedSample * 24
        
        const cx = Math.cos(angle) * distance
        const cy = Math.sin(angle) * distance
        
        ctx.beginPath()
        ctx.moveTo(cx, cy - diamondSize)
        ctx.lineTo(cx + diamondSize, cy)
        ctx.lineTo(cx, cy + diamondSize)
        ctx.lineTo(cx - diamondSize, cy)
        ctx.closePath()
        
        ctx.fillStyle = `hsla(${100 + d * 16 + frame.highEnergy * 160}, 89%, 66%, ${easedSample * 0.48})`
        ctx.fill()
        ctx.strokeStyle = `hsla(${100 + d * 16 + frame.highEnergy * 160 + 70}, 96%, 78%, ${easedSample * 0.78})`
        ctx.lineWidth = 1.1 + easedSample * 2.3
        ctx.stroke()
      }
    }
  },
  {
    name: 'Pentagon Spiral',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const pentagons = 10
      for (let p = 0; p < pentagons; p++) {
        const freqIndex = Math.floor((p / pentagons) * frame.frequencyData.length * 0.78)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 0.84) * sensitivity
        
        if (easedMag < 0.1) continue
        
        const pentRadius = ((p + 1) / pentagons) * radius * 0.9
        const rotation = seed + (p / pentagons) * Math.PI * 0.8 + easedMag * Math.PI * 0.4
        
        ctx.save()
        ctx.rotate(rotation)
        
        ctx.beginPath()
        for (let v = 0; v < 5; v++) {
          const angle = (v / 5) * Math.PI * 2 - Math.PI / 2
          const x = Math.cos(angle) * pentRadius * (1 + easedMag * 0.25)
          const y = Math.sin(angle) * pentRadius * (1 + easedMag * 0.25)
          if (v === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        ctx.strokeStyle = `hsla(${220 + p * 28 + frame.bassEnergy * 110}, 88%, 68%, ${easedMag * 0.8})`
        ctx.lineWidth = 1.3 + easedMag * 2.6
        ctx.stroke()
        
        if (easedMag > 0.5) {
          ctx.fillStyle = `hsla(${220 + p * 28 + frame.bassEnergy * 110}, 82%, 60%, ${easedMag * 0.38})`
          ctx.fill()
        }
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Octagonal Web',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const rings = 7
      for (let ring = 1; ring <= rings; ring++) {
        const ringRadius = (ring / rings) * radius * 0.88
        const freqIndex = Math.floor((ring / rings) * frame.frequencyData.length * 0.75)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 0.8) * sensitivity
        
        if (easedMag < 0.1) continue
        
        ctx.save()
        ctx.rotate(seed * 0.5)
        
        ctx.beginPath()
        for (let s = 0; s <= 8; s++) {
          const angle = (s / 8) * Math.PI * 2
          const wave = Math.sin(angle * 4 + seed) * easedMag * 10
          const r = ringRadius + wave
          const x = Math.cos(angle) * r
          const y = Math.sin(angle) * r
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        ctx.strokeStyle = `hsla(${300 + ring * 25 + frame.midEnergy * 120}, 90%, 70%, ${easedMag * 0.75})`
        ctx.lineWidth = 1.2 + easedMag * 2.4
        ctx.stroke()
        
        ctx.restore()
      }
      
      // Radial spokes
      for (let spoke = 0; spoke < 8; spoke++) {
        const angle = (spoke / 8) * Math.PI * 2 + seed * 0.5
        ctx.strokeStyle = `hsla(${320 + spoke * 15 + frame.highEnergy * 100}, 85%, 65%, 0.4)`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(angle) * radius * 0.88, Math.sin(angle) * radius * 0.88)
        ctx.stroke()
      }
    }
  },
  {
    name: 'Cross Pattern',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const crosses = 12
      const step = Math.floor(frame.frequencyData.length / crosses)
      
      for (let c = 0; c < crosses; c++) {
        const sample = frame.frequencyData[Math.min(c * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.79) * sensitivity
        
        if (easedSample < 0.12) continue
        
        const angle = (c / crosses) * Math.PI * 2 + seed
        const distance = radius * (0.25 + easedSample * 0.65)
        const crossSize = 12 + easedSample * 28
        
        const cx = Math.cos(angle) * distance
        const cy = Math.sin(angle) * distance
        
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(angle + easedSample * Math.PI * 0.5)
        
        ctx.strokeStyle = `hsla(${20 + c * 24 + frame.bassEnergy * 150}, 88%, 68%, ${easedSample * 0.8})`
        ctx.lineWidth = 2 + easedSample * 4
        ctx.lineCap = 'round'
        
        // Vertical
        ctx.beginPath()
        ctx.moveTo(0, -crossSize)
        ctx.lineTo(0, crossSize)
        ctx.stroke()
        
        // Horizontal
        ctx.beginPath()
        ctx.moveTo(-crossSize, 0)
        ctx.lineTo(crossSize, 0)
        ctx.stroke()
        
        ctx.restore()
      }
    }
  },
  {
    name: 'Gear Teeth',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const teeth = 28
      const step = Math.floor(frame.frequencyData.length / teeth)
      
      for (let t = 0; t < teeth; t++) {
        const sample = frame.frequencyData[Math.min(t * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.83) * sensitivity
        
        if (easedSample < 0.1) continue
        
        const angle = (t / teeth) * Math.PI * 2 + seed
        const innerR = radius * 0.65
        const outerR = radius * (0.75 + easedSample * 0.2)
        
        const x1 = Math.cos(angle - 0.05) * innerR
        const y1 = Math.sin(angle - 0.05) * innerR
        const x2 = Math.cos(angle - 0.05) * outerR
        const y2 = Math.sin(angle - 0.05) * outerR
        const x3 = Math.cos(angle + 0.05) * outerR
        const y3 = Math.sin(angle + 0.05) * outerR
        const x4 = Math.cos(angle + 0.05) * innerR
        const y4 = Math.sin(angle + 0.05) * innerR
        
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineTo(x3, y3)
        ctx.lineTo(x4, y4)
        ctx.closePath()
        
        ctx.fillStyle = `hsla(${140 + t * 10 + frame.midEnergy * 130}, 85%, 65%, ${easedSample * 0.5})`
        ctx.fill()
        ctx.strokeStyle = `hsla(${140 + t * 10 + frame.midEnergy * 130 + 60}, 95%, 75%, ${easedSample * 0.75})`
        ctx.lineWidth = 1.2
        ctx.stroke()
      }
    }
  },
  {
    name: 'Zigzag Rings',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const rings = 8
      for (let ring = 0; ring < rings; ring++) {
        const freqIndex = Math.floor((ring / rings) * frame.frequencyData.length * 0.76)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 0.82) * sensitivity
        
        if (easedMag < 0.1) continue
        
        const ringRadius = ((ring + 1) / rings) * radius * 0.87
        const points = 32
        
        ctx.beginPath()
        for (let p = 0; p <= points; p++) {
          const angle = (p / points) * Math.PI * 2 + seed
          const zigzag = (p % 2 === 0 ? 1 : 0.85)
          const r = ringRadius * zigzag * (1 + easedMag * 0.2)
          const x = Math.cos(angle) * r
          const y = Math.sin(angle) * r
          if (p === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        ctx.strokeStyle = `hsla(${80 + ring * 30 + frame.highEnergy * 140}, 88%, 68%, ${easedMag * 0.8})`
        ctx.lineWidth = 1.4 + easedMag * 2.8
        ctx.stroke()
        
        if (easedMag > 0.55) {
          ctx.fillStyle = `hsla(${80 + ring * 30 + frame.highEnergy * 140}, 80%, 60%, ${easedMag * 0.3})`
          ctx.fill()
        }
      }
    }
  },
  {
    name: 'Lotus Geometry',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const layers = 6
      for (let layer = 0; layer < layers; layer++) {
        const petals = 8 + layer * 2
        const layerRadius = ((layer + 1) / layers) * radius * 0.85
        const freqIndex = Math.floor((layer / layers) * frame.frequencyData.length * 0.74)
        const magnitude = frame.frequencyData[freqIndex] / 255
        const easedMag = Math.pow(magnitude, 0.77) * sensitivity
        
        if (easedMag < 0.1) continue
        
        for (let p = 0; p < petals; p++) {
          const angle = (p / petals) * Math.PI * 2 + seed + layer * 0.3
          const petalSize = (radius / layers) * 0.6 * (0.7 + easedMag * 0.5)
          
          ctx.save()
          ctx.rotate(angle)
          ctx.translate(0, layerRadius)
          
          ctx.beginPath()
          ctx.moveTo(0, -petalSize * 0.3)
          ctx.quadraticCurveTo(petalSize * 0.4, 0, 0, petalSize * 0.7)
          ctx.quadraticCurveTo(-petalSize * 0.4, 0, 0, -petalSize * 0.3)
          ctx.closePath()
          
          ctx.fillStyle = `hsla(${260 + layer * 25 + frame.midEnergy * 120}, 86%, 64%, ${easedMag * 0.55})`
          ctx.fill()
          ctx.strokeStyle = `hsla(${260 + layer * 25 + frame.midEnergy * 120 + 50}, 95%, 76%, ${easedMag * 0.7})`
          ctx.lineWidth = 0.8
          ctx.stroke()
          
          ctx.restore()
        }
      }
    }
  },
  
  // Oddish/Unusual Shapes (6)
  {
    name: 'Fractal Branches',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const branches = 12
      const step = Math.floor(frame.frequencyData.length / branches)
      
      const drawBranch = (x: number, y: number, length: number, angle: number, depth: number, mag: number) => {
        if (depth === 0 || length < 3) return
        
        const endX = x + Math.cos(angle) * length
        const endY = y + Math.sin(angle) * length
        
        const gradient = ctx.createLinearGradient(x, y, endX, endY)
        gradient.addColorStop(0, `hsla(${seed * 100 + depth * 40}, 88%, 68%, ${mag * (0.8 - depth * 0.15)})`)
        gradient.addColorStop(1, `hsla(${seed * 100 + depth * 40 + 60}, 92%, 72%, ${mag * (0.6 - depth * 0.1)})`)
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = depth * 0.8 + mag * 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        
        // Recursively draw sub-branches
        drawBranch(endX, endY, length * 0.68, angle - 0.5, depth - 1, mag)
        drawBranch(endX, endY, length * 0.68, angle + 0.5, depth - 1, mag)
      }
      
      for (let b = 0; b < branches; b++) {
        const sample = frame.frequencyData[Math.min(b * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.75) * sensitivity
        
        if (easedSample < 0.15) continue
        
        const angle = (b / branches) * Math.PI * 2 + seed
        const startLength = radius * (0.2 + easedSample * 0.4)
        
        ctx.save()
        drawBranch(0, 0, startLength, angle, 4, easedSample)
        ctx.restore()
      }
    }
  },
  {
    name: 'Voronoi Cells',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const cells = 16
      const step = Math.floor(frame.frequencyData.length / cells)
      const points: Array<{ x: number; y: number; mag: number; hue: number }> = []
      
      for (let c = 0; c < cells; c++) {
        const angle = (c / cells) * Math.PI * 2 + seed
        const sample = frame.frequencyData[Math.min(c * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.8) * sensitivity
        const distance = radius * (0.2 + easedSample * 0.6)
        
        points.push({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          mag: easedSample,
          hue: c * 22 + frame.midEnergy * 140
        })
      }
      
      points.forEach((point, i) => {
        if (point.mag < 0.12) return
        
        const cellSize = 15 + point.mag * 35
        
        ctx.save()
        ctx.translate(point.x, point.y)
        
        // Draw irregular polygon around point
        ctx.beginPath()
        for (let v = 0; v < 6; v++) {
          const vAngle = (v / 6) * Math.PI * 2
          const variation = 0.7 + Math.sin(vAngle * 3 + seed + i) * 0.3
          const vx = Math.cos(vAngle) * cellSize * variation
          const vy = Math.sin(vAngle) * cellSize * variation
          if (v === 0) ctx.moveTo(vx, vy)
          else ctx.lineTo(vx, vy)
        }
        ctx.closePath()
        
        ctx.fillStyle = `hsla(${point.hue}, 84%, 62%, ${point.mag * 0.4})`
        ctx.fill()
        ctx.strokeStyle = `hsla(${point.hue + 60}, 92%, 72%, ${point.mag * 0.75})`
        ctx.lineWidth = 1.2 + point.mag * 2.5
        ctx.stroke()
        
        ctx.restore()
      })
    }
  },
  {
    name: 'Spirograph',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const R = radius * 0.7
      const r = radius * 0.25
      const d = radius * 0.4
      const points = 200
      
      const avgMagnitude = frame.frequencyData.slice(0, 100).reduce((sum, v) => sum + v, 0) / 100 / 255
      const easedMag = Math.pow(avgMagnitude, 0.8) * sensitivity
      
      if (easedMag < 0.1) return
      
      ctx.beginPath()
      for (let t = 0; t <= points; t++) {
        const theta = (t / points) * Math.PI * 12 + seed
        const x = (R - r) * Math.cos(theta) + d * Math.cos((R - r) / r * theta)
        const y = (R - r) * Math.sin(theta) - d * Math.sin((R - r) / r * theta)
        
        if (t === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      
      const gradient = ctx.createLinearGradient(-radius, -radius, radius, radius)
      gradient.addColorStop(0, `hsla(${seed * 150 + frame.highEnergy * 180}, 90%, 70%, ${easedMag * 0.75})`)
      gradient.addColorStop(0.5, `hsla(${seed * 150 + frame.highEnergy * 180 + 120}, 95%, 75%, ${easedMag * 0.85})`)
      gradient.addColorStop(1, `hsla(${seed * 150 + frame.highEnergy * 180 + 240}, 90%, 70%, ${easedMag * 0.75})`)
      
      ctx.strokeStyle = gradient
      ctx.lineWidth = 1.5 + easedMag * 3.5
      ctx.stroke()
    }
  },
  {
    name: 'Lissajous Curves',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const curves = 8
      const step = Math.floor(frame.frequencyData.length / curves)
      
      for (let c = 0; c < curves; c++) {
        const sample = frame.frequencyData[Math.min(c * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.78) * sensitivity
        
        if (easedSample < 0.12) continue
        
        const A = radius * 0.4 * (0.6 + easedSample * 0.4)
        const B = radius * 0.35 * (0.6 + easedSample * 0.4)
        const a = 3 + c
        const b = 2 + c * 0.5
        const delta = seed + c * 0.5
        const points = 150
        
        ctx.beginPath()
        for (let t = 0; t <= points; t++) {
          const theta = (t / points) * Math.PI * 2
          const x = A * Math.sin(a * theta + delta)
          const y = B * Math.sin(b * theta)
          
          if (t === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        
        ctx.strokeStyle = `hsla(${c * 40 + frame.midEnergy * 150}, 88%, 68%, ${easedSample * 0.7})`
        ctx.lineWidth = 1.2 + easedSample * 2.8
        ctx.stroke()
      }
    }
  },
  {
    name: 'Strange Attractor',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const avgMagnitude = frame.frequencyData.slice(0, 120).reduce((sum, v) => sum + v, 0) / 120 / 255
      const easedMag = Math.pow(avgMagnitude, 0.82) * sensitivity
      
      if (easedMag < 0.1) return
      
      let x = 0.1
      let y = 0.1
      const scale = radius * 0.15
      const iterations = 800
      const a = 1.4 + Math.sin(seed) * 0.3
      const b = 0.3 + Math.cos(seed) * 0.1
      
      ctx.beginPath()
      for (let i = 0; i < iterations; i++) {
        const xNew = Math.sin(a * y) - Math.cos(b * x)
        const yNew = Math.sin(x) - Math.cos(y)
        
        const px = xNew * scale * (1 + easedMag * 0.5)
        const py = yNew * scale * (1 + easedMag * 0.5)
        
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
        
        x = xNew
        y = yNew
      }
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
      gradient.addColorStop(0, `hsla(${frame.bassEnergy * 180 + 200}, 92%, 72%, ${easedMag * 0.8})`)
      gradient.addColorStop(0.5, `hsla(${frame.bassEnergy * 180 + 280}, 88%, 68%, ${easedMag * 0.7})`)
      gradient.addColorStop(1, `hsla(${frame.bassEnergy * 180 + 360}, 85%, 65%, ${easedMag * 0.6})`)
      
      ctx.strokeStyle = gradient
      ctx.lineWidth = 0.8 + easedMag * 2
      ctx.stroke()
    }
  },
  {
    name: 'Hypnotic Spiral',
    render: (ctx, radius, frame, sensitivity, seed) => {
      const spirals = 6
      const step = Math.floor(frame.frequencyData.length / spirals)
      
      for (let s = 0; s < spirals; s++) {
        const sample = frame.frequencyData[Math.min(s * step, frame.frequencyData.length - 1)] / 255
        const easedSample = Math.pow(sample, 0.8) * sensitivity
        
        if (easedSample < 0.12) continue
        
        const points = 120
        const maxRadius = radius * 0.85
        const spiralTurns = 3 + easedSample * 2
        
        ctx.beginPath()
        for (let p = 0; p <= points; p++) {
          const t = p / points
          const angle = t * Math.PI * 2 * spiralTurns + seed + s * (Math.PI * 2 / spirals)
          const r = t * maxRadius * (0.7 + easedSample * 0.3)
          const wobble = Math.sin(angle * 4) * easedSample * 15
          const x = Math.cos(angle) * (r + wobble)
          const y = Math.sin(angle) * (r + wobble)
          
          if (p === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        
        const gradient = ctx.createLinearGradient(-radius, 0, radius, 0)
        gradient.addColorStop(0, `hsla(${s * 60 + frame.highEnergy * 180}, 90%, 70%, ${easedSample * 0.8})`)
        gradient.addColorStop(0.5, `hsla(${s * 60 + frame.highEnergy * 180 + 120}, 95%, 75%, ${easedSample * 0.9})`)
        gradient.addColorStop(1, `hsla(${s * 60 + frame.highEnergy * 180}, 90%, 70%, ${easedSample * 0.8})`)
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.8 + easedSample * 3.5
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    }
  }
]

// Shuffle function for random order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function MorphingKaleidoscope({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shuffledOrderRef = useRef<number[]>([])
  const currentIndexRef = useRef(0)
  const shapeTimerRef = useRef(0)
  const nextShapeTimeRef = useRef(12 + Math.random() * 16)
  const transitionProgressRef = useRef(0)
  const isTransitioningRef = useRef(false)

  // Initialize shuffled order
  if (shuffledOrderRef.current.length === 0) {
    shuffledOrderRef.current = shuffleArray(Array.from({ length: SHAPES.length }, (_, i) => i))
  }

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame, time) => {
      const { width, height } = dims
      ctx.fillStyle = 'rgba(5,6,10,0.25)'
      ctx.fillRect(0, 0, width, height)

      const radius = Math.min(width, height) * 0.6
      const angleStep = (Math.PI * 2) / SEGMENTS
      const rotation = frame.bassEnergy * Math.PI * sensitivity * 0.3 + time * 0.0001

      // Shape morphing with smooth transitions
      shapeTimerRef.current += 0.016
      
      if (!isTransitioningRef.current && shapeTimerRef.current >= nextShapeTimeRef.current) {
        isTransitioningRef.current = true
        transitionProgressRef.current = 0
      }

      if (isTransitioningRef.current) {
        transitionProgressRef.current += 0.008
        
        if (transitionProgressRef.current >= 1) {
          isTransitioningRef.current = false
          currentIndexRef.current = (currentIndexRef.current + 1) % shuffledOrderRef.current.length
          
          // Reshuffle when we complete the cycle
          if (currentIndexRef.current === 0) {
            shuffledOrderRef.current = shuffleArray(Array.from({ length: SHAPES.length }, (_, i) => i))
          }
          
          shapeTimerRef.current = 0
          nextShapeTimeRef.current = 12 + Math.random() * 16
          transitionProgressRef.current = 0
        }
      }

      const currentShapeIndex = shuffledOrderRef.current[currentIndexRef.current]
      const nextShapeIndex = shuffledOrderRef.current[(currentIndexRef.current + 1) % shuffledOrderRef.current.length]
      const currentShape = SHAPES[currentShapeIndex]
      const nextShape = SHAPES[nextShapeIndex]
      const transitionEase = 0.5 - Math.cos(transitionProgressRef.current * Math.PI) / 2

      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate(rotation)

      for (let i = 0; i < SEGMENTS; i += 1) {
        ctx.save()
        ctx.rotate(angleStep * i)

        // Render current shape
        if (!isTransitioningRef.current || transitionProgressRef.current < 1) {
          ctx.globalAlpha = isTransitioningRef.current ? 1 - transitionEase : 1
          currentShape.render(ctx, radius, frame, sensitivity, i)
        }

        // Render next shape during transition
        if (isTransitioningRef.current) {
          ctx.globalAlpha = transitionEase
          nextShape.render(ctx, radius, frame, sensitivity, i)
        }

        ctx.globalAlpha = 1

        // Mirror
        ctx.scale(1, -1)
        if (!isTransitioningRef.current || transitionProgressRef.current < 1) {
          ctx.globalAlpha = isTransitioningRef.current ? 1 - transitionEase : 1
          currentShape.render(ctx, radius, frame, sensitivity, i + 0.5)
        }
        if (isTransitioningRef.current) {
          ctx.globalAlpha = transitionEase
          nextShape.render(ctx, radius, frame, sensitivity, i + 0.5)
        }

        ctx.restore()
      }

      ctx.restore()

      // Gentle center glow
      if (frame.bassEnergy > 0.7) {
        const glowSize = 50 + frame.bassEnergy * 80
        const glowGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, glowSize)
        glowGradient.addColorStop(0, `hsla(${time * 0.1}, 85%, 65%, ${frame.bassEnergy * 0.35})`)
        glowGradient.addColorStop(0.6, `hsla(${time * 0.1 + 80}, 75%, 55%, ${frame.bassEnergy * 0.2})`)
        glowGradient.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

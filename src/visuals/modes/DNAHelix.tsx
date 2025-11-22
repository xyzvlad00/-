import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import { type VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'

interface GeneticBlob {
  x: number
  y: number
  targetX: number
  targetY: number
  radius: number
  targetRadius: number
  hue: number
  energy: number
  angle: number
  orbitRadius: number
  orbitSpeed: number
}

// Organic genetic flow visualization
function DNAHelix({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('dna')
  const audioConfig = useAudioMappingConfig('dna')
  const blobsRef = useRef<GeneticBlob[]>([])
  const timeRef = useRef(0)
  const flowWaveRef = useRef<number[]>([])
  
  const NUM_BLOBS = qualityParams.particleCount || 24

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      timeRef.current += 0.016

      // Organic flowing background
      ctx.fillStyle = theme === 'dark' ? 'rgba(2, 5, 12, 0.15)' : 'rgba(240, 243, 250, 0.15)'
      ctx.fillRect(0, 0, width, height)

      // Use normalized energies
      const bassEnergy = frame.bassEnergyNorm * sensitivity * (audioConfig.bassWeight || 1.3)
      const midEnergy = frame.midEnergyNorm * sensitivity * (audioConfig.midWeight || 1.1)
      const highEnergy = frame.highEnergyNorm * sensitivity * (audioConfig.highWeight || 1.2)
      
      // Initialize genetic blobs
      if (blobsRef.current.length === 0) {
        for (let i = 0; i < NUM_BLOBS; i++) {
          const angle = (i / NUM_BLOBS) * Math.PI * 2
          const orbitRadius = 80 + (i % 3) * 60
          blobsRef.current.push({
            x: centerX + Math.cos(angle) * orbitRadius,
            y: centerY + Math.sin(angle) * orbitRadius,
            targetX: centerX,
            targetY: centerY,
            radius: 20 + Math.random() * 20,
            targetRadius: 20,
            hue: (i / NUM_BLOBS) * 360,
            energy: 0,
            angle: angle,
            orbitRadius: orbitRadius,
            orbitSpeed: 0.01 + (i % 2) * 0.005,
          })
        }
      }

      // Initialize flow wave buffer
      if (flowWaveRef.current.length === 0) {
        flowWaveRef.current = Array(100).fill(0)
      }

      // Update flow wave
      flowWaveRef.current.shift()
      flowWaveRef.current.push(bassEnergy * 50 + midEnergy * 30)

      // Draw central genetic flow stream
      ctx.save()
      ctx.translate(centerX, 0)
      
      ctx.strokeStyle = hsl(180 + bassEnergy * 80, 80, 55, 0.4)
      ctx.lineWidth = 3 + bassEnergy * 5
      ctx.beginPath()
      
      for (let i = 0; i < flowWaveRef.current.length; i++) {
        const y = (i / flowWaveRef.current.length) * height
        const offset = flowWaveRef.current[i] * Math.sin(i * 0.1 + timeRef.current)
        if (i === 0) ctx.moveTo(offset, y)
        else ctx.lineTo(offset, y)
      }
      ctx.stroke()
      
      // Mirror flow
      ctx.scale(-1, 1)
      ctx.stroke()
      
      ctx.restore()

      // Update and draw genetic blobs
      blobsRef.current.forEach((blob, i) => {
        // Get frequency for this blob
        const freqIndex = Math.floor((i / NUM_BLOBS) * frame.frequencyData.length)
        const freqEnergy = frame.frequencyData[freqIndex] / 255
        
        // Smooth energy response
        blob.energy += (freqEnergy - blob.energy) * 0.2
        
        // Organic orbital motion
        blob.angle += blob.orbitSpeed * (1 + midEnergy * 0.5)
        const dynamicOrbitRadius = blob.orbitRadius * (1 + bassEnergy * 0.3 + blob.energy * 0.4)
        
        blob.targetX = centerX + Math.cos(blob.angle) * dynamicOrbitRadius
        blob.targetY = centerY + Math.sin(blob.angle) * dynamicOrbitRadius + Math.sin(timeRef.current + i) * 30 * midEnergy
        
        // Smooth position interpolation
        blob.x += (blob.targetX - blob.x) * 0.1
        blob.y += (blob.targetY - blob.y) * 0.1
        
        // Dynamic radius
        blob.targetRadius = 20 + blob.energy * 40 + bassEnergy * 15
        blob.radius += (blob.targetRadius - blob.radius) * 0.15
        
        // Color cycling
        blob.hue = (blob.hue + 0.3 + highEnergy * 0.5) % 360
      })

      // Sort by y position for depth
      const sortedBlobs = [...blobsRef.current].sort((a, b) => a.y - b.y)

      // Draw connections between nearby blobs (genetic bonds)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < sortedBlobs.length; i++) {
        const blob1 = sortedBlobs[i]
        for (let j = i + 1; j < sortedBlobs.length; j++) {
          const blob2 = sortedBlobs[j]
          const dx = blob2.x - blob1.x
          const dy = blob2.y - blob1.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 200) {
            const avgEnergy = (blob1.energy + blob2.energy) / 2
            const opacity = (1 - distance / 200) * 0.4 * (0.5 + avgEnergy * 0.5)
            
            // Flowing gradient connection
            const gradient = ctx.createLinearGradient(blob1.x, blob1.y, blob2.x, blob2.y)
            gradient.addColorStop(0, hsl(blob1.hue, 85, 60, opacity))
            gradient.addColorStop(0.5, hsl((blob1.hue + blob2.hue) / 2, 90, 65, opacity * 1.2))
            gradient.addColorStop(1, hsl(blob2.hue, 85, 60, opacity))
            
            ctx.strokeStyle = gradient
            ctx.lineWidth = 1 + avgEnergy * 3
            ctx.beginPath()
            
            // Curved connection
            const midX = (blob1.x + blob2.x) / 2
            const midY = (blob1.y + blob2.y) / 2
            const cpX = midX + Math.sin(timeRef.current + i + j) * 20
            const cpY = midY + Math.cos(timeRef.current + i + j) * 20
            
            ctx.moveTo(blob1.x, blob1.y)
            ctx.quadraticCurveTo(cpX, cpY, blob2.x, blob2.y)
            ctx.stroke()
            
            // Energy pulse along connection
            if (avgEnergy > 0.5) {
              const pulsePos = (timeRef.current * 2 + i * 0.5) % 1
              const pulseX = blob1.x + (blob2.x - blob1.x) * pulsePos
              const pulseY = blob1.y + (blob2.y - blob1.y) * pulsePos
              
              const pulseGrad = createRadialGradient(ctx, pulseX, pulseY, 0, 8, [
                { offset: 0, color: hsl((blob1.hue + blob2.hue) / 2, 100, 80, avgEnergy) },
                { offset: 0.5, color: hsl((blob1.hue + blob2.hue) / 2, 95, 70, avgEnergy * 0.6) },
                { offset: 1, color: 'transparent' },
              ])
              
              ctx.fillStyle = pulseGrad
              ctx.beginPath()
              ctx.arc(pulseX, pulseY, 8, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over'

      // Draw genetic blobs
      sortedBlobs.forEach((blob) => {
        // Outer glow
        const glowGrad = createRadialGradient(ctx, blob.x, blob.y, 0, blob.radius * 2, [
          { offset: 0, color: hsl(blob.hue, 90, 60, 0.6 + blob.energy * 0.3) },
          { offset: 0.4, color: hsl(blob.hue, 85, 55, 0.4 + blob.energy * 0.2) },
          { offset: 0.7, color: hsl(blob.hue + 30, 80, 50, 0.2 + blob.energy * 0.1) },
          { offset: 1, color: 'transparent' },
        ])
        
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, blob.radius * 2, 0, Math.PI * 2)
        ctx.fill()
        
        // Main blob body with organic shape
        ctx.save()
        ctx.translate(blob.x, blob.y)
        ctx.beginPath()
        
        const segments = 12
        for (let s = 0; s <= segments; s++) {
          const angle = (s / segments) * Math.PI * 2
          const wobble = Math.sin(angle * 3 + timeRef.current * 2 + blob.angle) * 0.2 * blob.energy
          const r = blob.radius * (1 + wobble)
          const x = Math.cos(angle) * r
          const y = Math.sin(angle) * r
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        const blobGrad = createRadialGradient(ctx, 0, 0, 0, blob.radius, [
          { offset: 0, color: hsl(blob.hue, 95, 75, 0.9) },
          { offset: 0.5, color: hsl(blob.hue, 90, 65, 0.85) },
          { offset: 0.8, color: hsl(blob.hue + 20, 85, 55, 0.8) },
          { offset: 1, color: hsl(blob.hue + 40, 80, 45, 0.7) },
        ])
        
        ctx.fillStyle = blobGrad
        ctx.fill()
        
        // Inner highlight
        if (blob.energy > 0.3) {
          ctx.fillStyle = hsl(blob.hue, 100, 90, blob.energy * 0.5)
          ctx.beginPath()
          ctx.arc(-blob.radius * 0.2, -blob.radius * 0.2, blob.radius * 0.3, 0, Math.PI * 2)
          ctx.fill()
        }
        
        // Genetic code rings
        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = blob.radius * (0.3 + ring * 0.2)
          const ringAngle = timeRef.current * (1 + ring * 0.5) + blob.angle * 2
          
          ctx.strokeStyle = hsl(blob.hue + ring * 30, 85, 70, 0.3 + blob.energy * 0.2)
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(0, 0, ringRadius, ringAngle, ringAngle + Math.PI * 0.5)
          ctx.stroke()
        }
        
        ctx.restore()
      })

      // Ambient genetic particles
      if (Math.random() < highEnergy * 0.5) {
        ctx.globalCompositeOperation = 'lighter'
        for (let p = 0; p < 5; p++) {
          const px = Math.random() * width
          const py = Math.random() * height
          const phue = (timeRef.current * 50 + Math.random() * 180) % 360
          
          ctx.fillStyle = hsl(phue, 90, 70, 0.3)
          ctx.beginPath()
          ctx.arc(px, py, 1 + Math.random() * 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
      }

      // Genetic code text overlay (subtle)
      if (frame.isTransient) {
        const codes = ['ATCG', 'GCTA', 'TAGC', 'CGAT']
        const code = codes[Math.floor(Math.random() * codes.length)]
        
        ctx.fillStyle = hsl(180 + bassEnergy * 80, 80, 60, 0.6)
        ctx.font = 'bold 48px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(code, centerX, centerY)
      }
    },
    [sensitivity, theme, NUM_BLOBS],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-gradient-to-br from-black/30 to-blue-900/20" />
}

export default DNAHelix

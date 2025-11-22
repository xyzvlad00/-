import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// 2D DNA Helix - Endless scroll with obstacles
function DNAHelix({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollOffsetRef = useRef(0)
  const timeRef = useRef(0)

  const helixRadiusRef = useRef(80)
  const segmentHeightRef = useRef(40)
  const NUM_SEGMENTS = 35

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      timeRef.current += 0.016

      // Background
      ctx.fillStyle = theme === 'dark' ? 'rgba(0, 5, 10, 0.2)' : 'rgba(255, 255, 255, 0.2)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Scroll speed increases with audio
      const scrollSpeed = 3 + midEnergy * 8 + bassEnergy * 5
      scrollOffsetRef.current += scrollSpeed

      // Dynamic helix size based on screen and audio
      helixRadiusRef.current = Math.min(width, height) * 0.15 + bassEnergy * 40
      segmentHeightRef.current = 30 + highEnergy * 15

      // Draw DNA helix segments
      for (let i = -5; i < NUM_SEGMENTS; i++) {
        const y = (i * segmentHeightRef.current - scrollOffsetRef.current % segmentHeightRef.current) + height / 2
        
        if (y < -50 || y > height + 50) continue

        const t = (scrollOffsetRef.current / segmentHeightRef.current + i) * 0.3
        
        // Left strand position
        const leftX = centerX + Math.sin(t) * helixRadiusRef.current
        const leftZ = Math.cos(t) // Depth
        
        // Right strand position (180 degrees offset)
        const rightX = centerX + Math.sin(t + Math.PI) * helixRadiusRef.current
        const rightZ = Math.cos(t + Math.PI) // Depth

        // Draw connections between strands
        if (Math.abs(leftZ - rightZ) < 0.5) { // Only connect when they're close in Z
          ctx.beginPath()
          ctx.moveTo(leftX, y)
          ctx.lineTo(rightX, y)
          ctx.strokeStyle = `hsla(${(t * 50 + 60) % 360}, 80%, 60%, 0.4)`
          ctx.lineWidth = 2
          ctx.stroke()

          // Base pairs (larger and more reactive)
          const baseSize = 6 + bassEnergy * 8 + highEnergy * 6
          
          // Left base
          ctx.beginPath()
          ctx.arc(leftX, y, baseSize, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${(t * 50) % 360}, 80%, 60%, ${0.7 + leftZ * 0.3})`
          ctx.shadowBlur = 10 + bassEnergy * 10
          ctx.shadowColor = `hsla(${(t * 50) % 360}, 100%, 70%, 0.8)`
          ctx.fill()

          // Right base
          ctx.beginPath()
          ctx.arc(rightX, y, baseSize, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${(t * 50 + 180) % 360}, 80%, 60%, ${0.7 + rightZ * 0.3})`
          ctx.shadowColor = `hsla(${(t * 50 + 180) % 360}, 100%, 70%, 0.8)`
          ctx.fill()
          ctx.shadowBlur = 0
        }

        // Draw strand tubes with perspective (larger, more visible)
        const strandWidth = 12 + Math.abs(leftZ) * 8 + midEnergy * 6
        
        // Left strand
        ctx.beginPath()
        ctx.arc(leftX, y, strandWidth, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(200, 80%, ${50 + leftZ * 20}%, ${0.6 + Math.abs(leftZ) * 0.4})`
        ctx.fill()

        // Right strand
        ctx.beginPath()
        ctx.arc(rightX, y, strandWidth, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(320, 80%, ${50 + rightZ * 20}%, ${0.6 + Math.abs(rightZ) * 0.4})`
        ctx.fill()
      }

      // Draw tunnel effect
      const gradient = ctx.createRadialGradient(centerX, height / 2, 0, centerX, height / 2, Math.max(width, height))
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(0.7, 'transparent')
      gradient.addColorStop(1, theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Draw speed indicator
      ctx.shadowBlur = 0
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
      ctx.font = 'bold 20px monospace'
      ctx.fillText(`SPEED: ${scrollSpeed.toFixed(1)}x`, 15, 30)
      
      // Draw distance
      const distance = Math.floor(scrollOffsetRef.current / 10)
      ctx.fillText(`DISTANCE: ${distance}m`, 15, 55)

      // Pulsing glow effects (enhanced)
      for (let i = 0; i < 5; i++) {
        const ringY = height / 2 + Math.sin(timeRef.current * 2 + i) * highEnergy * 80
        ctx.beginPath()
        ctx.arc(centerX, ringY, helixRadiusRef.current * (1.8 + i * 0.3), 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${(timeRef.current * 60 + i * 72) % 360}, 90%, 65%, ${(0.25 - i * 0.04) * (1 + bassEnergy)})`
        ctx.lineWidth = 4 + bassEnergy * 4
        ctx.stroke()
      }
      
      // Add particle effects along the helix
      if (highEnergy > 0.3) {
        for (let p = 0; p < 10; p++) {
          const particleT = (scrollOffsetRef.current * 0.02 + p * 0.5) % (Math.PI * 2)
          const particleX = centerX + Math.sin(particleT) * helixRadiusRef.current
          const particleY = height / 2 + (p - 5) * 50
          const particleSize = 3 + highEnergy * 5
          
          ctx.beginPath()
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${(particleT * 100 + 180) % 360}, 100%, 70%, ${highEnergy})`
          ctx.shadowBlur = 15 + highEnergy * 15
          ctx.shadowColor = `hsla(${(particleT * 100 + 180) % 360}, 100%, 70%, ${highEnergy})`
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
    },
    [sensitivity, theme],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

export default DNAHelix

import { useRef } from 'react'
import { useEnhancedCanvasLoop, useQualityParams, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl, createRadialGradient } from '../utils/colors'

type DeformationType = 'fisheye' | 'shear' | 'swirl' | 'stretch' | 'ripple'
type DoorStyle = 'rectangle' | 'arch' | 'circle' | 'polygon'
type DoorPhase = 'approaching' | 'crossing' | 'decay'

interface Door {
  id: number
  position: number
  style: DoorStyle
  deformationType: DeformationType
  colorScheme: number
  width: number
  height: number
  crossThreshold: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  hue: number
  size: number
  life: number
}

// Enhanced dimensional door traversal
function RecursiveThresholds({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qualityParams = useQualityParams('thresholds')
  const audioConfig = useAudioMappingConfig('thresholds')
  
  const cameraZRef = useRef(0)
  const doorQueueRef = useRef<Door[]>([])
  const currentDoorIdRef = useRef(0)
  const phaseRef = useRef<DoorPhase>('approaching')
  const deformationFactorRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const timeRef = useRef(0)

  const DOOR_DISTANCE = 800
  const MAX_PARTICLES = qualityParams.segmentCount || 50

  const deformationTypes: DeformationType[] = ['fisheye', 'shear', 'swirl', 'stretch', 'ripple']
  const doorStyles: DoorStyle[] = ['rectangle', 'arch', 'circle', 'polygon']

  const createDoor = (id: number, position: number): Door => {
    return {
      id,
      position,
      style: doorStyles[Math.floor(Math.random() * doorStyles.length)],
      deformationType: deformationTypes[Math.floor(Math.random() * deformationTypes.length)],
      colorScheme: Math.random() * 360,
      width: 180 + Math.random() * 120,
      height: 250 + Math.random() * 150,
      crossThreshold: position - 100,
    }
  }

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      const centerX = width / 2
      const centerY = height / 2
      timeRef.current += 0.016

      // Use normalized energies
      const bassEnergy = frame.bassEnergyNorm * sensitivity * (audioConfig.bassWeight || 1.4)
      const midEnergy = frame.midEnergyNorm * sensitivity * (audioConfig.midWeight || 1.2)
      const highEnergy = frame.highEnergyNorm * sensitivity * (audioConfig.highWeight || 1.1)

      // Bass: Camera speed (door approach rate) - purely audio-driven
      const baseSpeed = 1 + bassEnergy * 10 + midEnergy * 5
      cameraZRef.current += baseSpeed

      // Initialize door queue
      if (doorQueueRef.current.length === 0) {
        for (let i = 0; i < 3; i++) {
          doorQueueRef.current.push(createDoor(currentDoorIdRef.current++, DOOR_DISTANCE * (i + 1)))
        }
      }

      // Check current door state
      const currentDoor = doorQueueRef.current[0]
      if (currentDoor) {
        // State machine
        if (phaseRef.current === 'approaching' && cameraZRef.current >= currentDoor.crossThreshold) {
          phaseRef.current = 'crossing'
        } else if (phaseRef.current === 'crossing') {
          // Deformation envelope: 0 → 1 → 0
          deformationFactorRef.current = Math.min(1, deformationFactorRef.current + 0.04)
          
          if (deformationFactorRef.current >= 0.95) {
            phaseRef.current = 'decay'
          }
        } else if (phaseRef.current === 'decay') {
          deformationFactorRef.current = Math.max(0, deformationFactorRef.current - 0.03)
          
          if (deformationFactorRef.current <= 0.05) {
            // Spawn next door
            doorQueueRef.current.shift()
            doorQueueRef.current.push(createDoor(
              currentDoorIdRef.current++,
              doorQueueRef.current[doorQueueRef.current.length - 1].position + DOOR_DISTANCE
            ))
            phaseRef.current = 'approaching'
            deformationFactorRef.current = 0
          }
        }

        // Mid energy: modulate deformation amplitude
        const deformationAmplitude = deformationFactorRef.current * (0.8 + midEnergy * 0.4)

        // Transient: extra twitch
        if (frame.isTransient) {
          deformationFactorRef.current = Math.min(1, deformationFactorRef.current + 0.15)
          
          // Burst of particles
          for (let p = 0; p < 10; p++) {
            particlesRef.current.push({
              x: centerX + (Math.random() - 0.5) * 100,
              y: centerY + (Math.random() - 0.5) * 100,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              hue: currentDoor.colorScheme,
              size: 2 + Math.random() * 4,
              life: 1,
            })
          }
        }

        // Deep void background
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
        gradient.addColorStop(0, theme === 'dark' ? 'rgba(10, 12, 20, 1)' : 'rgba(230, 235, 245, 1)')
        gradient.addColorStop(0.6, theme === 'dark' ? 'rgba(5, 6, 12, 1)' : 'rgba(215, 220, 235, 1)')
        gradient.addColorStop(1, theme === 'dark' ? 'rgba(0, 0, 5, 1)' : 'rgba(200, 205, 220, 1)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // Apply deformation transform
        ctx.save()

        // Deformation selection based on current door
        const applyDeformation = (x: number, y: number): { x: number; y: number } => {
          const dx = x - centerX
          const dy = y - centerY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const angle = Math.atan2(dy, dx)

          switch (currentDoor.deformationType) {
            case 'fisheye': {
              const factor = 1 + deformationAmplitude * 0.6 * (1 - Math.min(1, dist / (width * 0.5)))
              return {
                x: centerX + dx * factor,
                y: centerY + dy * factor,
              }
            }
            case 'shear': {
              return {
                x: x + dy * deformationAmplitude * 0.4,
                y: y + dx * deformationAmplitude * 0.3,
              }
            }
            case 'swirl': {
              const swirl = deformationAmplitude * (1 - Math.min(1, dist / (width * 0.5))) * 0.6
              const newAngle = angle + swirl
              return {
                x: centerX + Math.cos(newAngle) * dist,
                y: centerY + Math.sin(newAngle) * dist,
              }
            }
            case 'stretch': {
              const stretchFactor = 1 + deformationAmplitude * 0.5
              return {
                x: centerX + dx * stretchFactor,
                y: y,
              }
            }
            case 'ripple': {
              const rippleDist = Math.sin(dist * 0.02 - timeRef.current * 3) * deformationAmplitude * 30
              const newDist = dist + rippleDist
              return {
                x: centerX + Math.cos(angle) * newDist,
                y: centerY + Math.sin(angle) * newDist,
              }
            }
            default:
              return { x, y }
          }
        }

        // Ambient particle field
        if (Math.random() < 0.3 + highEnergy * 0.5 && particlesRef.current.length < MAX_PARTICLES) {
          particlesRef.current.push({
            x: (Math.random() - 0.5) * width + centerX,
            y: (Math.random() - 0.5) * height + centerY,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            hue: (timeRef.current * 50 + Math.random() * 100) % 360,
            size: 1 + Math.random() * 2,
            life: 0.5 + Math.random() * 0.5,
          })
        }

        // Update and draw particles with deformation
        particlesRef.current = particlesRef.current.filter((particle) => {
          particle.x += particle.vx
          particle.y += particle.vy
          particle.life -= 0.01
          
          if (particle.life <= 0) return false
          
          const deformed = applyDeformation(particle.x, particle.y)
          
          ctx.fillStyle = hsl(particle.hue, 85, 65, particle.life * 0.7)
          ctx.beginPath()
          ctx.arc(deformed.x, deformed.y, particle.size * particle.life, 0, Math.PI * 2)
          ctx.fill()
          
          return true
        })

        // Draw doors
        doorQueueRef.current.forEach((door) => {
          const relZ = door.position - cameraZRef.current
          if (relZ > -200 && relZ < DOOR_DISTANCE * 2) {
            const scale = 1000 / (1000 + relZ)
            const doorWidth = door.width * scale
            const doorHeight = door.height * scale
            const doorY = centerY - doorHeight / 2

            // Door frame vertices
            const vertices: Array<{ x: number; y: number }> = []
            
            switch (door.style) {
              case 'rectangle':
                vertices.push(
                  { x: centerX - doorWidth / 2, y: doorY },
                  { x: centerX + doorWidth / 2, y: doorY },
                  { x: centerX + doorWidth / 2, y: doorY + doorHeight },
                  { x: centerX - doorWidth / 2, y: doorY + doorHeight }
                )
                break
              case 'arch':
                vertices.push({ x: centerX - doorWidth / 2, y: doorY + doorHeight })
                for (let a = 0; a <= Math.PI; a += Math.PI / 12) {
                  vertices.push({
                    x: centerX + Math.cos(a + Math.PI) * doorWidth / 2,
                    y: doorY + doorHeight / 3 + Math.sin(a) * doorHeight / 3,
                  })
                }
                vertices.push({ x: centerX + doorWidth / 2, y: doorY + doorHeight })
                break
              case 'circle':
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
                  vertices.push({
                    x: centerX + Math.cos(a) * doorWidth / 2,
                    y: centerY + Math.sin(a) * doorHeight / 2,
                  })
                }
                break
              case 'polygon':
                for (let p = 0; p < 7; p++) {
                  const angle = (p / 7) * Math.PI * 2 - Math.PI / 2
                  vertices.push({
                    x: centerX + Math.cos(angle) * doorWidth / 2,
                    y: centerY + Math.sin(angle) * doorHeight / 2,
                  })
                }
                break
            }

            // Apply deformation to door
            const deformedVertices = vertices.map(v => applyDeformation(v.x, v.y))

            // Door void (inner darkness)
            ctx.beginPath()
            deformedVertices.forEach((v, i) => {
              if (i === 0) ctx.moveTo(v.x, v.y)
              else ctx.lineTo(v.x, v.y)
            })
            ctx.closePath()

            const doorHue = (door.colorScheme + midEnergy * 80) % 360
            
            // Deep void fill
            const voidGrad = createRadialGradient(ctx, centerX, centerY, 0, doorWidth * 0.5, [
              { offset: 0, color: hsl(doorHue, 80, 5, 0.95) },
              { offset: 0.5, color: hsl(doorHue, 70, 10, 0.9) },
              { offset: 1, color: hsl(doorHue, 60, 15, 0.7) },
            ])
            ctx.fillStyle = voidGrad
            ctx.fill()

            // Door frame with intense glow
            ctx.strokeStyle = hsl(doorHue + 60, 90, 55 + highEnergy * 20, 0.9)
            ctx.lineWidth = 3 + highEnergy * 5 + scale * 3
            ctx.shadowBlur = 20 + highEnergy * 30
            ctx.shadowColor = hsl(doorHue + 60, 100, 65, highEnergy * 0.9)
            ctx.stroke()
            
            // Inner glow
            ctx.strokeStyle = hsl(doorHue + 40, 100, 75, 0.5 + highEnergy * 0.4)
            ctx.lineWidth = 1.5 + highEnergy * 2
            ctx.shadowBlur = 15 + highEnergy * 20
            ctx.stroke()
            
            ctx.shadowBlur = 0

            // Door energy pattern
            ctx.save()
            const clip = new Path2D()
            deformedVertices.forEach((v, i) => {
              if (i === 0) clip.moveTo(v.x, v.y)
              else clip.lineTo(v.x, v.y)
            })
            clip.closePath()
            ctx.clip(clip)

            // Radial energy lines - audio-driven rotation
            for (let r = 0; r < 8; r++) {
              const angle = (r / 8) * Math.PI * 2 + (midEnergy * 3)
              const lineLength = Math.min(doorWidth, doorHeight) * (0.3 + highEnergy * 0.3)
              const x1 = centerX + Math.cos(angle) * 10
              const y1 = centerY + Math.sin(angle) * 10
              const x2 = centerX + Math.cos(angle) * lineLength
              const y2 = centerY + Math.sin(angle) * lineLength
              
              const p1 = applyDeformation(x1, y1)
              const p2 = applyDeformation(x2, y2)
              
              ctx.strokeStyle = hsl(doorHue + 120, 90, 60, 0.3 + highEnergy * 0.4)
              ctx.lineWidth = 1 + highEnergy * 2
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
            }
            
            ctx.restore()

            // Center sigil - audio-driven
            const sigilSize = doorWidth * 0.12 * (1 + midEnergy * 0.8)
            const sigilCenter = applyDeformation(centerX, centerY)
            
            ctx.strokeStyle = hsl(doorHue + 180, 90, 70, 0.9)
            ctx.lineWidth = 2 + highEnergy * 3
            ctx.shadowBlur = 10 + highEnergy * 15
            ctx.shadowColor = hsl(doorHue + 180, 100, 80, 0.7)
            
            ctx.beginPath()
            for (let s = 0; s < 6; s++) {
              const angle = (s / 6) * Math.PI * 2 + (bassEnergy * 2)
              const x = sigilCenter.x + Math.cos(angle) * sigilSize
              const y = sigilCenter.y + Math.sin(angle) * sigilSize
              if (s === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.stroke()
            
            // Inner ring - pulses with audio
            ctx.beginPath()
            ctx.arc(sigilCenter.x, sigilCenter.y, sigilSize * (0.5 + highEnergy * 0.3), 0, Math.PI * 2)
            ctx.stroke()
            
            ctx.shadowBlur = 0
          }
        })

        ctx.restore()

        // Deformation indicator (subtle)
        if (deformationAmplitude > 0.1) {
          ctx.fillStyle = hsl(currentDoor.colorScheme, 70, 60, deformationAmplitude * 0.2)
          ctx.font = '12px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(currentDoor.deformationType.toUpperCase(), centerX, height - 30)
        }
      }
    },
    [sensitivity, theme],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/60" />
}

export default RecursiveThresholds

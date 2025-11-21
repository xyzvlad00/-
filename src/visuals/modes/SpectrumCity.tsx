import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'

const BUILDINGS = 96

interface Building {
  x: number
  width: number
  baseHeight: number
  currentHeight: number
  targetHeight: number
  color: { r: number; g: number; b: number }
  windows: Array<{ y: number; lit: boolean; flicker: number }>
  hasAntenna: boolean
  style: 'modern' | 'classic' | 'tower'
}

export function SpectrumCity({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buildingsRef = useRef<Building[]>([])
  const cloudsRef = useRef<Array<{ x: number; y: number; speed: number; size: number; alpha: number }>>([])

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame, time) => {
      const { width, height } = dims
      const skylineHeight = height * 0.62

      // Initialize buildings
      if (buildingsRef.current.length === 0) {
        for (let i = 0; i < BUILDINGS; i++) {
          const buildingWidth = (width / BUILDINGS) + 3
          const style: Building['style'] = i % 3 === 0 ? 'tower' : i % 3 === 1 ? 'modern' : 'classic'
          
          buildingsRef.current.push({
            x: (i / BUILDINGS) * width,
            width: buildingWidth,
            baseHeight: 20 + Math.random() * 40,
            currentHeight: 60,
            targetHeight: 60,
            color: {
              r: 30 + Math.random() * 20,
              g: 35 + Math.random() * 25,
              b: 60 + Math.random() * 40,
            },
            windows: Array.from({ length: 12 }, (_, w) => ({
              y: w,
              lit: Math.random() > 0.3,
              flicker: Math.random(),
            })),
            hasAntenna: Math.random() > 0.7,
            style: style,
          })
        }

        // Initialize clouds
        for (let i = 0; i < 8; i++) {
          cloudsRef.current.push({
            x: Math.random() * width,
            y: Math.random() * skylineHeight * 0.4,
            speed: 0.1 + Math.random() * 0.3,
            size: 40 + Math.random() * 80,
            alpha: 0.1 + Math.random() * 0.15,
          })
        }
      }

      // Night sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, skylineHeight)
      skyGradient.addColorStop(0, '#0a0a1f')
      skyGradient.addColorStop(0.5, '#1a1a35')
      skyGradient.addColorStop(1, '#252540')
      ctx.fillStyle = skyGradient
      ctx.fillRect(0, 0, width, skylineHeight)

      // Stars
      for (let i = 0; i < 50; i++) {
        const starX = (i * 137 % width)
        const starY = (i * 73 % (skylineHeight * 0.7))
        const starAlpha = 0.3 + Math.sin(time * 0.001 + i) * 0.3
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`
        ctx.fillRect(starX, starY, 1, 1)
      }

      // Clouds
      cloudsRef.current.forEach((cloud) => {
        cloud.x += cloud.speed
        if (cloud.x > width + cloud.size) cloud.x = -cloud.size

        const cloudGradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.size)
        cloudGradient.addColorStop(0, `rgba(40, 40, 60, ${cloud.alpha})`)
        cloudGradient.addColorStop(0.6, `rgba(30, 30, 50, ${cloud.alpha * 0.6})`)
        cloudGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        ctx.fillStyle = cloudGradient
        ctx.beginPath()
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Ground/street
      const groundGradient = ctx.createLinearGradient(0, skylineHeight, 0, height)
      groundGradient.addColorStop(0, '#1a1a2a')
      groundGradient.addColorStop(1, '#0a0a15')
      ctx.fillStyle = groundGradient
      ctx.fillRect(0, skylineHeight, width, height - skylineHeight)

      // Street lights
      const streetLightSpacing = width / 20
      for (let i = 0; i < 20; i++) {
        const x = i * streetLightSpacing + streetLightSpacing / 2
        const glowSize = 30 + frame.overallVolume * 20 * sensitivity
        const glowGradient = ctx.createRadialGradient(x, skylineHeight + 5, 0, x, skylineHeight + 5, glowSize)
        glowGradient.addColorStop(0, `rgba(255, 200, 100, ${0.4 + frame.overallVolume * 0.3})`)
        glowGradient.addColorStop(0.5, `rgba(255, 180, 80, ${0.2 + frame.overallVolume * 0.2})`)
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(x, skylineHeight + 5, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }

      const step = Math.floor(frame.frequencyData.length / BUILDINGS)
      
      // Render buildings
      buildingsRef.current.forEach((building, i) => {
        const sample = frame.frequencyData[i * step] / 255
        const easedSample = Math.pow(sample, 1.15) * sensitivity
        
        building.targetHeight = building.baseHeight + easedSample * skylineHeight * 0.9 + frame.bassEnergy * 60
        building.currentHeight += (building.targetHeight - building.currentHeight) * 0.15
        
        const buildingHeight = Math.max(20, building.currentHeight)
        const buildingY = skylineHeight - buildingHeight

        // Building body
        const buildingGradient = ctx.createLinearGradient(building.x, buildingY, building.x + building.width, buildingY)
        buildingGradient.addColorStop(0, `rgba(${building.color.r}, ${building.color.g}, ${building.color.b}, 0.9)`)
        buildingGradient.addColorStop(0.5, `rgba(${building.color.r + 20}, ${building.color.g + 20}, ${building.color.b + 30}, 0.95)`)
        buildingGradient.addColorStop(1, `rgba(${building.color.r}, ${building.color.g}, ${building.color.b}, 0.9)`)
        
        ctx.fillStyle = buildingGradient

        // Different building shapes
        ctx.beginPath()
        if (building.style === 'tower') {
          ctx.moveTo(building.x + building.width * 0.2, skylineHeight)
          ctx.lineTo(building.x + building.width * 0.2, buildingY + 20)
          ctx.lineTo(building.x + building.width * 0.5, buildingY)
          ctx.lineTo(building.x + building.width * 0.8, buildingY + 20)
          ctx.lineTo(building.x + building.width * 0.8, skylineHeight)
        } else if (building.style === 'modern') {
          ctx.rect(building.x + 1, buildingY, building.width - 2, buildingHeight)
        } else {
          ctx.moveTo(building.x + 1, skylineHeight)
          ctx.lineTo(building.x + 1, buildingY + 15)
          ctx.lineTo(building.x + building.width / 2, buildingY)
          ctx.lineTo(building.x + building.width - 1, buildingY + 15)
          ctx.lineTo(building.x + building.width - 1, skylineHeight)
        }
        ctx.closePath()
        ctx.fill()

        // Edge highlight
        ctx.strokeStyle = `rgba(${building.color.r + 40}, ${building.color.g + 40}, ${building.color.b + 60}, 0.4)`
        ctx.lineWidth = 1
        ctx.stroke()

        // Windows
        const windowSize = Math.min(3, building.width / 4)
        const windowSpacing = Math.max(buildingHeight / 15, 8)
        
        building.windows.forEach((window) => {
          const windowY = skylineHeight - window.y * windowSpacing - 12
          if (windowY < buildingY || windowY > skylineHeight - 8) return
          
          window.flicker = window.flicker * 0.98 + (Math.random() > 0.95 ? 1 : 0) * 0.02
          
          if (window.lit) {
            const windowBrightness = 0.4 + window.flicker * 0.4 + frame.highEnergy * 0.3
            const windowGlow = Math.max(0, sample - 0.3) * 2
            
            if (windowGlow > 0) {
              ctx.shadowBlur = 8
              ctx.shadowColor = `rgba(255, 220, 150, ${windowGlow * 0.5})`
            }
            
            ctx.fillStyle = `rgba(255, 240, 180, ${windowBrightness})`
            ctx.fillRect(building.x + building.width / 3, windowY, windowSize, windowSize)
            ctx.fillRect(building.x + building.width * 2 / 3 - windowSize, windowY, windowSize, windowSize)
            
            ctx.shadowBlur = 0
          }
        })

        // Antenna with lights
        if (building.hasAntenna && easedSample > 0.5) {
          const antennaX = building.x + building.width / 2
          const antennaHeight = 15 + easedSample * 25
          
          ctx.strokeStyle = `rgba(150, 150, 180, 0.6)`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(antennaX, buildingY)
          ctx.lineTo(antennaX, buildingY - antennaHeight)
          ctx.stroke()
          
          // Blinking light
          if (Math.sin(time * 0.003 + i) > 0) {
            ctx.fillStyle = `rgba(255, 100, 100, ${0.8 + easedSample * 0.2})`
            ctx.shadowBlur = 12
            ctx.shadowColor = 'rgba(255, 100, 100, 0.8)'
            ctx.beginPath()
            ctx.arc(antennaX, buildingY - antennaHeight, 3, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0
          }
        }

        // Top highlight for high energy
        if (easedSample > 0.65) {
          const highlightGradient = ctx.createLinearGradient(building.x, buildingY, building.x, buildingY + 10)
          highlightGradient.addColorStop(0, `rgba(255, 200, 150, ${easedSample * 0.6})`)
          highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          
          ctx.fillStyle = highlightGradient
          ctx.fillRect(building.x, buildingY, building.width, 10)
        }
      })

      // Horizon glow
      const horizonGradient = ctx.createLinearGradient(0, skylineHeight - 30, 0, skylineHeight + 30)
      horizonGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      horizonGradient.addColorStop(0.5, `rgba(255, 180, 120, ${0.15 + frame.bassEnergy * 0.25})`)
      horizonGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = horizonGradient
      ctx.fillRect(0, skylineHeight - 30, width, 60)
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

import { useRef } from 'react'
import { useEnhancedCanvasLoop, useAudioMappingConfig } from '../useEnhancedCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl } from '../utils/colors'

// Matrix rain effect with audio reactivity
interface MatrixColumn {
  x: number
  y: number
  speed: number
  length: number
  glitchPhase: number
  chars: string[]
}

function MatrixRain({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioConfig = useAudioMappingConfig('matrix')
  const columnsRef = useRef<MatrixColumn[]>([])
  const timeRef = useRef(0)

  useEnhancedCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      timeRef.current += 0.016

      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, width, height)

      // Use normalized energies
      const bassEnergy = frame.bassEnergyNorm * sensitivity * (audioConfig.bassWeight || 1.0)
      const midEnergy = frame.midEnergyNorm * sensitivity * (audioConfig.midWeight || 1.0)
      const highEnergy = frame.highEnergyNorm * sensitivity * (audioConfig.highWeight || 1.0)

      const fontSize = 14 + bassEnergy * 4
      const columnWidth = fontSize
      const columnCount = Math.floor(width / columnWidth)

      // Initialize columns
      if (columnsRef.current.length === 0) {
        columnsRef.current = []
        for (let i = 0; i < columnCount; i++) {
          columnsRef.current.push({
            x: i * columnWidth,
            y: Math.random() * height - height,
            speed: 2 + Math.random() * 4,
            length: 15 + Math.floor(Math.random() * 25),
            glitchPhase: Math.random() * Math.PI * 2,
            chars: generateMatrixChars(40),
          })
        }
      }

      ctx.font = `${fontSize}px monospace`

      // Update and draw columns with frequency-specific behavior
      columnsRef.current.forEach((column, index) => {
        // Map column to frequency band
        const freqRatio = index / columnsRef.current.length
        const freqIndex = Math.floor(freqRatio * frame.frequencyData.length)
        const freqEnergy = frame.frequencyData[freqIndex] / 255
        
        // Determine which frequency band this column responds to
        let bandEnergy, bandHue
        if (freqRatio < 0.33) {
          // Low frequencies - red/orange
          bandEnergy = bassEnergy
          bandHue = 0 + freqEnergy * 60 // Red to orange
        } else if (freqRatio < 0.66) {
          // Mid frequencies - green
          bandEnergy = midEnergy
          bandHue = 100 + freqEnergy * 80 // Green to cyan
        } else {
          // High frequencies - blue/purple
          bandEnergy = highEnergy
          bandHue = 200 + freqEnergy * 100 // Blue to purple
        }
        
        // Audio-reactive speed with frequency-specific response
        const speedMultiplier = 1 + bandEnergy * 3 + freqEnergy * 2 + (frame.beatInfo?.isBeat ? 3 : 0)
        column.y += column.speed * speedMultiplier

        // Reset column when it goes off screen
        if (column.y > height + column.length * fontSize) {
          column.y = -column.length * fontSize
          column.speed = 2 + Math.random() * 4 + bandEnergy * 3
          column.length = 15 + Math.floor(Math.random() * 25) + Math.floor(freqEnergy * 15)
          column.chars = generateMatrixChars(40)
        }

        // Glitch effect based on high frequencies
        column.glitchPhase += 0.05 + highEnergy * 0.15 + freqEnergy * 0.1
        const glitch = Math.sin(column.glitchPhase) > 0.95 || freqEnergy > 0.8

        // Draw characters with frequency-specific coloring
        for (let i = 0; i < column.length; i++) {
          const charY = column.y + i * fontSize
          if (charY < 0 || charY > height) continue

          // Character brightness based on position in column and frequency energy
          const brightness = (1 - i / column.length) * (0.7 + freqEnergy * 0.3)
          const alpha = brightness * (0.7 + bandEnergy * 0.3)

          // Leading character (brightest) - colored by frequency band
          if (i === 0) {
            // Bright leading character with band color
            ctx.fillStyle = hsl(bandHue, 100, 90, alpha * 1.3)
            ctx.shadowBlur = 10 + bandEnergy * 15 + freqEnergy * 10
            ctx.shadowColor = hsl(bandHue, 100, 80, alpha)
          } else {
            // Trailing characters with band-specific hue
            const trailHue = bandHue + (glitch ? Math.random() * 60 - 30 : 0)
            const lightness = 40 + brightness * 50 + freqEnergy * 20
            const saturation = 70 + freqEnergy * 30
            ctx.fillStyle = hsl(trailHue, saturation, lightness, alpha)
            ctx.shadowBlur = brightness * (5 + bandEnergy * 8 + freqEnergy * 5)
            ctx.shadowColor = hsl(trailHue, 90, 60, alpha * 0.6)
          }

          // Get character (with occasional glitches)
          const charIndex = (index + i + Math.floor(timeRef.current * 10)) % column.chars.length
          const char = glitch && Math.random() > 0.8 ? getRandomChar() : column.chars[charIndex]

          ctx.fillText(char, column.x, charY)
        }

        ctx.shadowBlur = 0
      })

      // Beat flash effect
      if (frame.beatInfo?.isBeat && frame.beatInfo.confidence > 0.7) {
        ctx.fillStyle = hsl(120, 80, 70, frame.beatInfo.confidence * 0.15)
        ctx.fillRect(0, 0, width, height)
      }
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

// Generate random matrix-like characters
function generateMatrixChars(count: number): string[] {
  const chars: string[] = []
  const matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'
  
  for (let i = 0; i < count; i++) {
    chars.push(matrixChars[Math.floor(Math.random() * matrixChars.length)])
  }
  
  return chars
}

function getRandomChar(): string {
  const matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'
  return matrixChars[Math.floor(Math.random() * matrixChars.length)]
}

export default MatrixRain

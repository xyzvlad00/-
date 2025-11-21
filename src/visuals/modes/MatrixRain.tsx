import { useRef } from 'react'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { hsl } from '../utils/colors'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

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
  const columnsRef = useRef<MatrixColumn[]>([])
  const timeRef = useRef(0)

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
      const { width, height } = dims
      timeRef.current += 0.016

      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, width, height)

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

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

      // Update and draw columns
      columnsRef.current.forEach((column, index) => {
        // Audio-reactive speed
        const speedMultiplier = 1 + midEnergy * 2 + (frame.beatInfo?.isBeat ? 3 : 0)
        column.y += column.speed * speedMultiplier

        // Reset column when it goes off screen
        if (column.y > height + column.length * fontSize) {
          column.y = -column.length * fontSize
          column.speed = 2 + Math.random() * 4 + midEnergy * 2
          column.length = 15 + Math.floor(Math.random() * 25)
          column.chars = generateMatrixChars(40)
        }

        // Glitch effect
        column.glitchPhase += 0.05 + highEnergy * 0.1
        const glitch = Math.sin(column.glitchPhase) > 0.95

        // Draw characters
        for (let i = 0; i < column.length; i++) {
          const charY = column.y + i * fontSize
          if (charY < 0 || charY > height) continue

          // Character brightness based on position in column
          const brightness = 1 - i / column.length
          const alpha = brightness * (0.7 + highEnergy * 0.3)

          // Leading character (brightest)
          if (i === 0) {
            // White leading character
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.2})`
            ctx.shadowBlur = 8 + bassEnergy * 10
            ctx.shadowColor = hsl(120, 100, 70, alpha * 0.8)
          } else {
            // Green trailing characters
            const hue = 120 + (glitch ? Math.random() * 60 - 30 : 0)
            const lightness = 50 + brightness * 40
            ctx.fillStyle = hsl(hue, 80, lightness, alpha)
            ctx.shadowBlur = brightness * (4 + bassEnergy * 6)
            ctx.shadowColor = hsl(hue, 90, 60, alpha * 0.5)
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

      // BPM indicator
      if (frame.beatInfo && frame.beatInfo.bpm > 0) {
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)'
        ctx.font = '14px monospace'
        ctx.fillText(`BPM: ${frame.beatInfo.bpm}`, 10, 20)
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

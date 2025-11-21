import { useEffect, useState, useRef } from 'react'
import { Logo } from './Logo'

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'melting' | 'complete'>('loading')
  const [progress, setProgress] = useState(0)
  const [barHeights, setBarHeights] = useState<number[]>([])
  const timeRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  const NUM_BARS = 60
  const LOGO_BAR_INDEX = 30

  useEffect(() => {
    // Initialize bars
    const initialHeights = Array.from({ length: NUM_BARS }, () => Math.random() * 0.5 + 0.3)
    setBarHeights(initialHeights)

    // Smooth animation loop
    const animate = () => {
      timeRef.current += 0.016

      // Update bar heights with smooth waves
      setBarHeights(prev => 
        prev.map((_, i) => {
          const baseFreq = Math.sin(timeRef.current * 3 + i * 0.15) * 0.25
          const midFreq = Math.sin(timeRef.current * 5.5 + i * 0.08) * 0.18
          const highFreq = Math.sin(timeRef.current * 8 + i * 0.22) * 0.12
          const pulse = Math.sin(timeRef.current * 2 + i * 0.05) * 0.1
          
          return Math.max(0.2, Math.min(0.95, 0.4 + baseFreq + midFreq + highFreq + pulse))
        })
      )

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    // Progress
    let currentProgress = 0
    const progressInterval = setInterval(() => {
      currentProgress += currentProgress < 60 ? 4 : currentProgress < 90 ? 2 : 0.8
      if (currentProgress >= 100) {
        currentProgress = 100
        clearInterval(progressInterval)
      }
      setProgress(currentProgress)
    }, 100)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      clearInterval(progressInterval)
    }
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        setPhase('melting')
        onComplete()
        setTimeout(() => {
          setPhase('complete')
        }, 2000)
      }, 300)
    }
  }, [progress, onComplete])

  const logoHeight = barHeights[LOGO_BAR_INDEX] || 0.5

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden`}
      style={{
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 60%, #000000 100%)',
        opacity: phase === 'complete' ? 0 : 1,
        transition: phase === 'complete' ? 'opacity 1.2s ease-out 0.5s' : 'none',
        zIndex: 9999,
        pointerEvents: phase === 'complete' ? 'none' : 'auto',
      }}
    >
      {/* Animated radial pulses */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, transparent 70%)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%)',
            animation: 'pulse-glow 4s ease-in-out infinite 0.5s',
          }}
        />
      </div>

      {/* Floating ambient particles */}
      {Array.from({ length: 40 }, (_, i) => (
        <div
          key={`ambient-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            background: `rgba(${
              i % 3 === 0 ? '20, 184, 166' : 
              i % 3 === 1 ? '14, 165, 233' : 
              '59, 130, 246'
            }, ${0.3 + Math.random() * 0.4})`,
            boxShadow: `0 0 10px rgba(${
              i % 3 === 0 ? '20, 184, 166' : 
              i % 3 === 1 ? '14, 165, 233' : 
              '59, 130, 246'
            }, 0.6)`,
            animation: `float-unique ${15 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* Equalizer container with glass morphism */}
      <div 
        className="relative flex items-end justify-center gap-[3px] h-[60vh] w-[92vw] max-w-6xl rounded-3xl p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(20, 184, 166, 0.15) 0%, transparent 60%)',
          }}
        />

        {/* Bars */}
        {barHeights.map((height, i) => {
          const isLogoBar = i === LOGO_BAR_INDEX
          const position = i / NUM_BARS
          
          // Smooth color transition
          let hue, saturation, lightness
          if (position < 0.33) {
            hue = 174 + (position * 3) * 15 // Cyan range
            saturation = 80
            lightness = 55
          } else if (position < 0.66) {
            hue = 189 + ((position - 0.33) * 3) * 15 // Sky range
            saturation = 85
            lightness = 58
          } else {
            hue = 204 + ((position - 0.66) * 3) * 15 // Blue range
            saturation = 82
            lightness = 60
          }

          return (
            <div
              key={i}
              className="relative flex-1 transition-all duration-75 ease-out"
              style={{
                height: phase === 'loading' ? `${height * 100}%` : '0%',
                minHeight: phase === 'loading' ? '10%' : '0%',
                background: isLogoBar
                  ? `linear-gradient(to top, 
                      hsl(${hue}, ${saturation}%, ${lightness - 10}%) 0%,
                      hsl(${hue}, ${saturation + 10}%, ${lightness}%) 50%,
                      hsl(${hue}, ${saturation + 15}%, ${lightness + 15}%) 100%
                    )`
                  : `linear-gradient(to top, 
                      hsl(${hue}, ${saturation - 10}%, ${lightness - 15}%) 0%,
                      hsl(${hue}, ${saturation}%, ${lightness - 5}%) 60%,
                      hsl(${hue}, ${saturation + 5}%, ${lightness + 5}%) 100%
                    )`,
                borderRadius: '8px 8px 0 0',
                boxShadow: isLogoBar
                  ? `0 0 30px hsla(${hue}, ${saturation}%, ${lightness}%, 0.8),
                     0 -20px 40px hsla(${hue}, ${saturation}%, ${lightness}%, 0.4),
                     inset 0 -10px 20px rgba(255, 255, 255, 0.15)`
                  : height > 0.7
                    ? `0 0 15px hsla(${hue}, ${saturation}%, ${lightness}%, 0.5),
                       inset 0 -5px 10px rgba(255, 255, 255, 0.1)`
                    : `0 0 8px hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`,
                transform: phase === 'melting'
                  ? `scaleY(0) translateY(100%)`
                  : height > 0.75 ? 'scaleY(1.02)' : 'scaleY(1)',
                transformOrigin: 'bottom',
                opacity: phase === 'melting' ? 0 : (height > 0.4 ? 1 : 0.8),
                filter: height > 0.8 ? `brightness(1.2) saturate(1.1)` : 'brightness(1)',
                transition: phase === 'melting'
                  ? `all ${0.8 + Math.random() * 0.5}s cubic-bezier(0.6, 0, 0.8, 1) ${i * 0.012}s`
                  : 'all 0.075s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Glossy top highlight */}
              {height > 0.5 && phase === 'loading' && (
                <div
                  className="absolute top-0 left-0 right-0 h-12 rounded-t-lg pointer-events-none"
                  style={{
                    background: `linear-gradient(to bottom, 
                      rgba(255, 255, 255, ${height * 0.35}) 0%,
                      rgba(255, 255, 255, ${height * 0.15}) 50%,
                      transparent 100%
                    )`,
                  }}
                />
              )}

              {/* Logo */}
              {isLogoBar && phase === 'loading' && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    bottom: '100%',
                    marginBottom: '25px',
                    transform: `translate(-50%, 0) scale(${0.9 + logoHeight * 0.3}) rotate(${Math.sin(timeRef.current * 2) * 3}deg)`,
                  }}
                >
                  <Logo isAnimating={true} size={100} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Title with enhanced styling */}
      <div 
        className={`mt-20 transition-all duration-1000 ${
          progress > 10 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        } ${phase === 'melting' ? 'opacity-0 -translate-y-16 scale-110' : ''}`}
      >
        <h1
          className="text-6xl font-bold tracking-[0.15em] text-center mb-4"
          style={{
            background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 30%, #0ea5e9 60%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 60px rgba(20, 184, 166, 0.3)',
            filter: 'drop-shadow(0 4px 20px rgba(14, 165, 233, 0.4))',
          }}
        >
          VISUAL CONSTRUCT
        </h1>
        <p 
          className={`text-sm text-gray-400 text-center tracking-[0.3em] uppercase transition-all duration-700 ${
            progress > 25 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            textShadow: '0 0 20px rgba(20, 184, 166, 0.3)',
          }}
        >
          Audio Reactive Experience
        </p>
      </div>

      {/* Sleek progress bar */}
      <div
        className={`mt-12 w-[500px] max-w-[90vw] transition-all duration-700 ${
          progress > 20 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${phase === 'melting' ? 'opacity-0 scale-90' : ''}`}
      >
        {/* Progress container */}
        <div className="relative h-2 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-full overflow-hidden backdrop-blur-sm">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #14b8a6 0%, #06b6d4 25%, #0ea5e9 50%, #3b82f6 75%, #6366f1 100%)',
              boxShadow: '0 0 25px rgba(20, 184, 166, 0.8), 0 0 50px rgba(14, 165, 233, 0.5)',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                animation: 'shimmer 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Percentage */}
        <div
          className="mt-5 text-center text-lg font-bold font-mono"
          style={{
            background: 'linear-gradient(90deg, #14b8a6, #0ea5e9, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 30px rgba(20, 184, 166, 0.5)',
          }}
        >
          {Math.floor(progress)}%
        </div>
      </div>

      {/* Melting effect */}
      {phase === 'melting' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 100 }, (_, i) => (
            <div
              key={`melt-${i}`}
              className="absolute"
              style={{
                left: `${(i / 100) * 100}%`,
                top: '38%',
                width: `${2 + Math.random() * 2}px`,
                height: `${100 + Math.random() * 150}px`,
                background: `linear-gradient(to bottom, 
                  hsla(${174 + (i / 100) * 40}, 80%, 60%, 0.9) 0%,
                  hsla(${174 + (i / 100) * 40}, 80%, 50%, 0.6) 40%,
                  transparent 100%
                )`,
                boxShadow: `0 0 10px hsla(${174 + (i / 100) * 40}, 80%, 60%, 0.6)`,
                filter: 'blur(0.8px)',
                animation: `drip-fall ${0.9 + Math.random() * 0.6}s cubic-bezier(0.5, 0, 0.7, 1) forwards`,
                animationDelay: `${i * 0.01}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

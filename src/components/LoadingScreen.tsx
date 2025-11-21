import { useEffect, useState, useRef } from 'react'
import { Logo } from './Logo'

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'intro' | 'loading' | 'melting' | 'complete'>('intro')
  const [progress, setProgress] = useState(0)
  const [barHeights, setBarHeights] = useState<number[]>([])
  const timeRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  const NUM_BARS = 60
  const LOGO_BAR_INDEX = 30

  useEffect(() => {
    // Initialize bars at low height
    const initialHeights = Array.from({ length: NUM_BARS }, () => 0.1 + Math.random() * 0.1)
    setBarHeights(initialHeights)

    let introProgress = 0
    let hasStartedLoading = false

    // Smooth animation loop with natural intro
    const animate = () => {
      timeRef.current += 0.016

      // Intro phase - bars grow naturally
      if (phase === 'intro' && introProgress < 1) {
        introProgress += 0.012 // Slower intro
        setBarHeights(prev => 
          prev.map((_, i) => {
            // Staggered growth from left to right
            const staggerDelay = (i / NUM_BARS) * 0.5
            const growth = Math.max(0, Math.min(1, introProgress - staggerDelay))
            const eased = growth * growth * (3 - 2 * growth) // Smooth ease-in-out
            
            // Natural randomness
            const target = 0.3 + Math.random() * 0.3
            return 0.1 + (target * eased)
          })
        )
        
        if (introProgress >= 1 && !hasStartedLoading) {
          hasStartedLoading = true
          setPhase('loading')
        }
      }
      
      // Loading phase - natural audio-like movement
      if (phase === 'loading') {
        setBarHeights(prev => 
          prev.map((currentHeight, i) => {
            // Multiple frequencies like real audio spectrum
            const position = i / NUM_BARS
            
            // Low frequencies (bass) - slower, larger waves on left
            const bassWave = Math.sin(timeRef.current * 1.8 + position * 0.5) * 0.3 * (1 - position * 0.5)
            
            // Mid frequencies - medium waves in middle
            const midWave = Math.sin(timeRef.current * 3.5 + position * 1.2) * 0.22 * (position < 0.7 ? 1 : 0.5)
            
            // High frequencies - faster, smaller waves on right
            const highWave = Math.sin(timeRef.current * 6 + position * 2) * 0.15 * (position > 0.3 ? 1 : 0.3)
            
            // Random energy bursts (like beat hits)
            const burstChance = Math.random()
            const burst = burstChance > 0.98 ? Math.random() * 0.25 : 0
            
            // Natural target with inertia
            const targetHeight = 0.35 + bassWave + midWave + highWave + burst
            
            // Smooth interpolation (inertia)
            const newHeight = currentHeight + (targetHeight - currentHeight) * 0.15
            
            return Math.max(0.12, Math.min(0.95, newHeight))
          })
        )
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    // Progress - starts after intro
    const progressTimer = setTimeout(() => {
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += currentProgress < 60 ? 3.5 : currentProgress < 90 ? 1.8 : 0.7
        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(progressInterval)
        }
        setProgress(currentProgress)
      }, 100)

      return () => clearInterval(progressInterval)
    }, 1200) // Wait for intro to mostly complete

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      clearTimeout(progressTimer)
    }
  }, [phase])

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
      {phase !== 'intro' && Array.from({ length: 35 }, (_, i) => (
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
          
          // Natural frequency-based colors
          let hue, saturation, lightness
          if (position < 0.33) {
            // Bass - cyan/teal
            hue = 174 + (position * 3) * 12
            saturation = 75 + height * 10
            lightness = 52 + height * 8
          } else if (position < 0.66) {
            // Mid - sky blue
            hue = 186 + ((position - 0.33) * 3) * 18
            saturation = 80 + height * 8
            lightness = 55 + height * 8
          } else {
            // High - blue
            hue = 204 + ((position - 0.66) * 3) * 12
            saturation = 78 + height * 10
            lightness = 58 + height * 8
          }

          return (
            <div
              key={i}
              className="relative flex-1 transition-all ease-out"
              style={{
                height: phase === 'loading' || phase === 'intro' ? `${height * 100}%` : '0%',
                minHeight: phase === 'loading' || phase === 'intro' ? '8%' : '0%',
                background: isLogoBar
                  ? `linear-gradient(to top, 
                      hsl(${hue}, ${saturation}%, ${lightness - 12}%) 0%,
                      hsl(${hue}, ${saturation + 12}%, ${lightness + 2}%) 50%,
                      hsl(${hue}, ${saturation + 18}%, ${lightness + 18}%) 100%
                    )`
                  : `linear-gradient(to top, 
                      hsl(${hue}, ${saturation - 8}%, ${lightness - 18}%) 0%,
                      hsl(${hue}, ${saturation}%, ${lightness - 8}%) 60%,
                      hsl(${hue}, ${saturation + 8}%, ${lightness + 8}%) 100%
                    )`,
                borderRadius: '8px 8px 0 0',
                boxShadow: isLogoBar
                  ? `0 0 25px hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + height * 0.3}),
                     0 -15px 35px hsla(${hue}, ${saturation}%, ${lightness}%, ${0.3 + height * 0.2}),
                     inset 0 -8px 16px rgba(255, 255, 255, ${0.1 + height * 0.08})`
                  : height > 0.7
                    ? `0 0 12px hsla(${hue}, ${saturation}%, ${lightness}%, ${height * 0.5}),
                       inset 0 -4px 8px rgba(255, 255, 255, ${height * 0.08})`
                    : `0 0 6px hsla(${hue}, ${saturation}%, ${lightness}%, ${height * 0.3})`,
                transform: phase === 'melting'
                  ? `scaleY(0) translateY(100%)`
                  : height > 0.75 ? `scaleY(${1 + (height - 0.75) * 0.08})` : 'scaleY(1)',
                transformOrigin: 'bottom',
                opacity: phase === 'melting' ? 0 : (height > 0.35 ? 1 : 0.75 + height * 0.4),
                filter: height > 0.8 ? `brightness(${1.15 + (height - 0.8) * 0.3}) saturate(1.1)` : 'brightness(1)',
                transitionDuration: phase === 'melting' ? `${0.8 + Math.random() * 0.5}s` : '0.1s',
                transitionTimingFunction: phase === 'melting' ? 'cubic-bezier(0.6, 0, 0.8, 1)' : 'ease-out',
                transitionDelay: phase === 'melting' ? `${i * 0.012}s` : '0s',
              }}
            >
              {/* Glossy top highlight */}
              {height > 0.45 && (phase === 'loading' || phase === 'intro') && (
                <div
                  className="absolute top-0 left-0 right-0 h-12 rounded-t-lg pointer-events-none"
                  style={{
                    background: `linear-gradient(to bottom, 
                      rgba(255, 255, 255, ${height * 0.32}) 0%,
                      rgba(255, 255, 255, ${height * 0.12}) 50%,
                      transparent 100%
                    )`,
                  }}
                />
              )}

              {/* Logo */}
              {isLogoBar && (phase === 'loading' || phase === 'intro') && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    bottom: '100%',
                    marginBottom: '25px',
                    transform: `translate(-50%, 0) scale(${0.88 + logoHeight * 0.35}) rotate(${Math.sin(timeRef.current * 1.8) * 2.5}deg)`,
                    opacity: phase === 'intro' ? Math.min(1, progress / 20) : 1,
                  }}
                >
                  <Logo isAnimating={phase === 'loading'} size={100} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Title with enhanced styling */}
      <div 
        className={`mt-20 transition-all duration-1000 ${
          progress > 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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
            progress > 20 ? 'opacity-100' : 'opacity-0'
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
          progress > 15 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${phase === 'melting' ? 'opacity-0 scale-90' : ''}`}
      >
        <div className="relative h-2 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #14b8a6 0%, #06b6d4 25%, #0ea5e9 50%, #3b82f6 75%, #6366f1 100%)',
              boxShadow: '0 0 25px rgba(20, 184, 166, 0.8), 0 0 50px rgba(14, 165, 233, 0.5)',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                animation: 'shimmer 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>

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

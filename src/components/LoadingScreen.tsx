import { useEffect, useState, useRef } from 'react'

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [wavePhase, setWavePhase] = useState(0)
  const [particles, setParticles] = useState<Array<{ angle: number; radius: number; speed: number; size: number; hue: number }>>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    // Initialize particles in orbital pattern
    const newParticles = Array.from({ length: 120 }, (_, i) => ({
      angle: (i / 120) * Math.PI * 2,
      radius: 100 + Math.random() * 150,
      speed: 0.002 + Math.random() * 0.004,
      size: 2 + Math.random() * 3,
      hue: (i / 120) * 360,
    }))
    setParticles(newParticles)

    // Animate waveforms and particles
    const animate = () => {
      timeRef.current += 0.016
      setWavePhase(timeRef.current)

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        angle: p.angle + p.speed,
        radius: p.radius + Math.sin(timeRef.current * 2 + p.angle) * 0.5,
      })))

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    // Progress simulation with musical timing (accelerando)
    let currentProgress = 0
    const progressInterval = setInterval(() => {
      if (currentProgress < 50) {
        currentProgress += 2.5 // Moderato
      } else if (currentProgress < 80) {
        currentProgress += 1.8 // Andante
      } else if (currentProgress < 95) {
        currentProgress += 1.0 // Adagio
      } else {
        currentProgress += 0.3 // Ritardando
      }

      if (currentProgress >= 100) {
        currentProgress = 100
        clearInterval(progressInterval)
        setTimeout(() => onComplete(), 600)
      }
      setProgress(currentProgress)
    }, 80)

    return () => {
      clearInterval(progressInterval)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [onComplete])

  // Draw circular waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = 500 * dpr
    canvas.height = 500 * dpr
    canvas.style.width = '500px'
    canvas.style.height = '500px'
    ctx.scale(dpr, dpr)

    const centerX = 250
    const centerY = 250
    const baseRadius = 140

    ctx.clearRect(0, 0, 500, 500)

    // Draw circular waveforms (like vinyl grooves / sound waves)
    for (let ring = 0; ring < 5; ring++) {
      ctx.beginPath()
      const ringRadius = baseRadius + ring * 25
      const points = 180

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2
        // Multiple frequency waves (like music spectrum)
        const wave1 = Math.sin(angle * 6 + wavePhase * 2) * 8 * (1 - ring * 0.15)
        const wave2 = Math.sin(angle * 3 - wavePhase * 1.5) * 5 * (1 - ring * 0.1)
        const wave3 = Math.sin(angle * 12 + wavePhase * 3) * 3
        
        const distortion = wave1 + wave2 + wave3
        const r = ringRadius + distortion
        
        const x = centerX + Math.cos(angle) * r
        const y = centerY + Math.sin(angle) * r

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      const hue = (ring * 60 + wavePhase * 20) % 360
      const gradient = ctx.createLinearGradient(
        centerX - ringRadius, centerY,
        centerX + ringRadius, centerY
      )
      gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.3)`)
      gradient.addColorStop(0.5, `hsla(${hue + 40}, 100%, 65%, 0.6)`)
      gradient.addColorStop(1, `hsla(${hue + 80}, 100%, 70%, 0.3)`)
      
      ctx.strokeStyle = gradient
      ctx.lineWidth = 2.5
      ctx.shadowBlur = 15
      ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.5)`
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Draw center pulsing core (like a speaker cone)
    const pulseSize = 35 + Math.sin(wavePhase * 2.5) * 12
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize)
    coreGradient.addColorStop(0, 'hsla(280, 100%, 80%, 1)')
    coreGradient.addColorStop(0.4, 'hsla(240, 100%, 70%, 0.8)')
    coreGradient.addColorStop(0.7, 'hsla(200, 100%, 60%, 0.4)')
    coreGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = coreGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2)
    ctx.fill()

    // Musical note particles orbiting
    particles.forEach((p) => {
      const x = centerX + Math.cos(p.angle) * p.radius
      const y = centerY + Math.sin(p.angle) * p.radius
      
      const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 2)
      particleGradient.addColorStop(0, `hsla(${p.hue}, 100%, 75%, 0.9)`)
      particleGradient.addColorStop(0.6, `hsla(${p.hue + 30}, 100%, 65%, 0.5)`)
      particleGradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = particleGradient
      ctx.beginPath()
      ctx.arc(x, y, p.size * 2, 0, Math.PI * 2)
      ctx.fill()
    })

  }, [wavePhase, particles])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #0f0f23 0%, #050510 70%, #000000 100%)',
        opacity: progress >= 100 ? 0 : 1,
        transition: progress >= 100 ? 'opacity 1s ease-out' : 'none',
        zIndex: 9999,
        pointerEvents: progress >= 100 ? 'none' : 'auto',
      }}
    >
      {/* Ambient background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={`ambient-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              background: `hsla(${(i * 7.2) % 360}, 100%, 70%, ${0.3 + Math.random() * 0.4})`,
              animation: `float-ambient ${20 + Math.random() * 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      {/* Main visualization canvas */}
      <div className="relative mb-16">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="opacity-90"
          style={{
            filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.4))',
          }}
        />

        {/* Center logo/icon - Musical symbol */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) scale(${0.9 + Math.sin(wavePhase * 2) * 0.15}) rotate(${Math.sin(wavePhase * 0.8) * 8}deg)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            {/* Treble clef inspired design */}
            <defs>
              <linearGradient id="musicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(280, 100%, 75%)" />
                <stop offset="50%" stopColor="hsl(240, 100%, 70%)" />
                <stop offset="100%" stopColor="hsl(200, 100%, 65%)" />
              </linearGradient>
            </defs>
            {/* Abstract waveform/frequency symbol */}
            <circle cx="40" cy="40" r="35" stroke="url(#musicGrad)" strokeWidth="2.5" fill="none" opacity="0.4" />
            <path
              d="M 25 40 Q 35 20, 40 35 T 55 40 Q 50 55, 40 45 T 25 40"
              stroke="url(#musicGrad)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))',
              }}
            />
            <circle cx="40" cy="40" r="6" fill="url(#musicGrad)" opacity="0.9" />
            {/* Frequency rings */}
            <circle cx="40" cy="40" r="25" stroke="url(#musicGrad)" strokeWidth="1.5" fill="none" opacity="0.25"
              style={{
                animation: 'pulse-ring 2s ease-in-out infinite',
              }}
            />
          </svg>
        </div>
      </div>

      {/* Title with musical typography */}
      <div className="relative z-10 mb-12">
        <h1
          className="text-7xl font-black tracking-[0.25em] text-center mb-3"
          style={{
            fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 20%, #60a5fa 40%, #38bdf8 60%, #22d3ee 80%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.5))',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          SONIC
        </h1>
        <h2
          className="text-5xl font-black tracking-[0.35em] text-center"
          style={{
            fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 25%, #0ea5e9 50%, #3b82f6 75%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 25px rgba(56, 189, 248, 0.5))',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            marginLeft: '0.18em',
          }}
        >
          CANVAS
        </h2>
        <p
          className="text-center mt-4 text-sm tracking-[0.4em] uppercase"
          style={{
            background: 'linear-gradient(90deg, #a78bfa, #60a5fa, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            opacity: progress > 20 ? 1 : 0,
            transition: 'opacity 0.8s ease-out',
            fontWeight: 600,
            letterSpacing: '0.4em',
            marginLeft: '0.4em',
          }}
        >
          Where Sound Becomes Vision
        </p>
      </div>

      {/* Progress bar with frequency band styling */}
      <div className="relative w-[600px] max-w-[90vw]">
        {/* Frequency band indicators */}
        <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest mb-2 px-1"
          style={{
            opacity: progress > 15 ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            fontWeight: 600,
          }}
        >
          <span style={{ color: 'hsl(280, 70%, 65%)' }}>Bass</span>
          <span style={{ color: 'hsl(240, 70%, 65%)' }}>Mid</span>
          <span style={{ color: 'hsl(200, 70%, 65%)' }}>High</span>
        </div>

        {/* Progress bar with frequency visualization style */}
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, rgba(167, 139, 250, 0.1) 0%, rgba(96, 165, 250, 0.1) 50%, rgba(34, 211, 238, 0.1) 100%)',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
            opacity: progress > 10 ? 1 : 0,
            transform: progress > 10 ? 'scaleY(1)' : 'scaleY(0)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Animated progress fill with frequency colors */}
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #a78bfa 0%, #818cf8 15%, #60a5fa 30%, #38bdf8 50%, #22d3ee 70%, #14b8a6 100%)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(56, 189, 248, 0.4)',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                animation: 'shimmer-fast 1.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Frequency peaks indicators */}
          {[25, 50, 75].map(pos => (
            <div
              key={pos}
              className="absolute top-0 bottom-0 w-[2px]"
              style={{
                left: `${pos}%`,
                background: progress > pos
                  ? 'rgba(255, 255, 255, 0.4)'
                  : 'rgba(255, 255, 255, 0.1)',
                transition: 'background 0.3s ease-out',
              }}
            />
          ))}
        </div>

        {/* Progress percentage with beat timing */}
        <div
          className="mt-6 text-center"
          style={{
            fontFamily: "'SF Mono', 'Monaco', 'Courier New', monospace",
            fontSize: '28px',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #a78bfa, #60a5fa, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            opacity: progress > 10 ? 1 : 0,
            transform: progress > 10 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '0.1em',
          }}
        >
          {Math.floor(progress)}
          <span style={{ fontSize: '20px', opacity: 0.7 }}>%</span>
        </div>

        {/* Loading text with musical terms */}
        <div
          className="mt-3 text-center text-xs tracking-[0.3em] uppercase"
          style={{
            color: 'rgba(168, 139, 250, 0.7)',
            opacity: progress > 15 ? 1 : 0,
            transition: 'opacity 0.8s ease-out',
            fontWeight: 600,
          }}
        >
          {progress < 30 ? 'Tuning Frequencies...' :
           progress < 60 ? 'Calibrating Harmonics...' :
           progress < 90 ? 'Synchronizing Rhythm...' :
           'Finalizing Canvas...'}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes float-ambient {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px); opacity: 0.8; }
        }
        @keyframes shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}

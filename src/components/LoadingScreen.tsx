import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Smooth progress with realistic loading curve
    let currentProgress = 0
    const progressInterval = setInterval(() => {
      if (currentProgress < 60) {
        currentProgress += 3
      } else if (currentProgress < 90) {
        currentProgress += 1.5
      } else if (currentProgress < 98) {
        currentProgress += 0.5
      } else {
        currentProgress = 100
      }

      if (currentProgress >= 100) {
        currentProgress = 100
        clearInterval(progressInterval)
        setTimeout(() => {
          setIsComplete(true)
          setTimeout(() => onComplete(), 800)
        }, 400)
      }
      setProgress(currentProgress)
    }, 60)

    return () => clearInterval(progressInterval)
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000 ${
        isComplete ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, #0a0a14 0%, #030306 100%)',
        zIndex: 9999,
        pointerEvents: isComplete ? 'none' : 'auto',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        
        {/* Floating orbs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              width: `${80 + i * 30}px`,
              height: `${80 + i * 30}px`,
              background: `radial-gradient(circle at 30% 30%, 
                hsla(${200 + i * 15}, 100%, 60%, 0.08) 0%, 
                hsla(${200 + i * 15}, 100%, 50%, 0.03) 50%,
                transparent 100%)`,
              animation: `float-smooth ${15 + i * 3}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
              filter: 'blur(40px)',
            }}
          />
        ))}

        {/* Subtle particle field */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '2px',
              height: '2px',
              background: `hsla(${200 + Math.random() * 60}, 100%, 70%, ${0.2 + Math.random() * 0.4})`,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: `0 0 ${4 + Math.random() * 6}px currentColor`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* VS Logo with micro-animations */}
        <div className="relative mb-8">
          {/* Outer glow ring */}
          <div 
            className="absolute inset-0 -m-12"
            style={{
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
              animation: 'pulse-glow 3s ease-in-out infinite',
              filter: 'blur(30px)',
            }}
          />

          {/* Sound wave rings */}
          {[0, 1, 2].map((i) => (
            <div
              key={`ring-${i}`}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{
                width: `${180 + i * 40}px`,
                height: `${180 + i * 40}px`,
                borderColor: `hsla(${200 + i * 20}, 100%, 60%, ${0.15 - i * 0.04})`,
                borderWidth: '1.5px',
                animation: `sound-pulse ${2 + i * 0.5}s ease-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}

          {/* VS Container */}
          <div className="relative flex items-center justify-center w-[200px] h-[200px]">
            {/* Background circle */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.12) 0%, rgba(20, 184, 166, 0.08) 50%, transparent 100%)',
                border: '2px solid rgba(56, 189, 248, 0.2)',
                boxShadow: `
                  inset 0 0 40px rgba(56, 189, 248, 0.1),
                  0 0 60px rgba(56, 189, 248, 0.15),
                  0 0 100px rgba(20, 184, 166, 0.1)
                `,
              }}
            />

            {/* VS Text */}
            <div className="relative">
              <div
                className="text-[120px] font-black tracking-tighter leading-none"
                style={{
                  fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 30%, #06b6d4 60%, #14b8a6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 30px rgba(56, 189, 248, 0.5)) drop-shadow(0 0 60px rgba(20, 184, 166, 0.3))',
                  animation: 'text-glow 4s ease-in-out infinite',
                  letterSpacing: '-0.05em',
                }}
              >
                VS
              </div>

              {/* Micro-animation: subtle rotating accent */}
              <div
                className="absolute -top-3 -right-3 w-3 h-3 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #14b8a6)',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.8), 0 0 40px rgba(20, 184, 166, 0.4)',
                  animation: 'orbit-accent 3s linear infinite',
                }}
              />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-2 mb-12">
          <h1
            className="text-4xl font-bold text-center tracking-[0.2em]"
            style={{
              fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
              background: 'linear-gradient(90deg, #e0f2fe 0%, #bfdbfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              marginLeft: '0.25em',
              fontWeight: 700,
            }}
          >
            Visual Construct
          </h1>
          <p
            className="text-sm text-center tracking-[0.3em] uppercase"
            style={{
              color: 'rgba(56, 189, 248, 0.6)',
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontWeight: 500,
              letterSpacing: '0.35em',
              marginLeft: '0.35em',
            }}
          >
            Sound Design Studio
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-[500px] max-w-[90vw] space-y-3">
          {/* Bar container */}
          <div className="relative h-1 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 30%, #06b6d4 70%, #14b8a6 100%)',
                boxShadow: `
                  0 0 20px rgba(56, 189, 248, 0.6),
                  0 0 40px rgba(20, 184, 166, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `,
              }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                  animation: 'shimmer 2s ease-in-out infinite',
                }}
              />
            </div>

            {/* Progress head glow */}
            {progress > 0 && progress < 100 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-1 h-4 rounded-full"
                style={{
                  left: `${progress}%`,
                  background: '#ffffff',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(56, 189, 248, 0.6)',
                  animation: 'pulse-dot 1s ease-in-out infinite',
                }}
              />
            )}
          </div>

          {/* Progress text */}
          <div className="flex items-center justify-between text-xs"
            style={{
              fontFamily: "'SF Mono', 'Monaco', 'Courier New', monospace",
            }}
          >
            <span style={{ color: 'rgba(56, 189, 248, 0.5)' }}>
              {progress < 30 ? 'INITIALIZING' : progress < 70 ? 'LOADING ASSETS' : progress < 95 ? 'PREPARING' : 'COMPLETE'}
            </span>
            <span 
              className="font-bold tabular-nums"
              style={{ 
                color: 'rgba(56, 189, 248, 0.8)',
                letterSpacing: '0.1em',
              }}
            >
              {Math.floor(progress)}%
            </span>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="mt-16 w-32 h-[1px] rounded-full relative overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.3) 50%, transparent 100%)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
              animation: 'scan-line 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float-smooth {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes sound-pulse {
          0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.5; }
          50% { opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
        }

        @keyframes text-glow {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(56, 189, 248, 0.5)) drop-shadow(0 0 60px rgba(20, 184, 166, 0.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(56, 189, 248, 0.7)) drop-shadow(0 0 80px rgba(20, 184, 166, 0.5)); }
        }

        @keyframes orbit-accent {
          0% { transform: rotate(0deg) translate(50px) rotate(0deg); }
          100% { transform: rotate(360deg) translate(50px) rotate(-360deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
          50% { opacity: 0.7; transform: translateY(-50%) scale(1.3); }
        }

        @keyframes scan-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

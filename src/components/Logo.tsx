import { useEffect, useState } from 'react'

interface LogoProps {
  isAnimating?: boolean
  size?: number
}

// Modern geometric logo with sound wave elements
export function Logo({ isAnimating = false, size = 120 }: LogoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isAnimating) {
      setMounted(true)
    }
  }, [isAnimating])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div
        className={`absolute inset-0 rounded-lg transition-all duration-500 ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, transparent 70%)',
          filter: 'blur(25px)',
        }}
      />

      {/* Main logo SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`relative z-10 transition-all duration-500 ${
          mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-80 rotate-180'
        }`}
      >
        {/* Hexagon outline */}
        <polygon
          points={`
            ${size * 0.5},${size * 0.15}
            ${size * 0.85},${size * 0.35}
            ${size * 0.85},${size * 0.65}
            ${size * 0.5},${size * 0.85}
            ${size * 0.15},${size * 0.65}
            ${size * 0.15},${size * 0.35}
          `}
          fill="none"
          stroke="url(#hexGradient)"
          strokeWidth="3"
          strokeLinejoin="miter"
          className={mounted ? 'opacity-90' : 'opacity-0'}
          style={{
            transition: 'opacity 0.5s',
          }}
        />

        {/* Inner hexagon */}
        <polygon
          points={`
            ${size * 0.5},${size * 0.25}
            ${size * 0.75},${size * 0.38}
            ${size * 0.75},${size * 0.62}
            ${size * 0.5},${size * 0.75}
            ${size * 0.25},${size * 0.62}
            ${size * 0.25},${size * 0.38}
          `}
          fill="url(#innerGradient)"
          opacity="0.2"
        />

        {/* Sound wave bars in center */}
        <g transform={`translate(${size * 0.5}, ${size * 0.5})`}>
          {[-18, -9, 0, 9, 18].map((x, i) => {
            const heights = [0.25, 0.4, 0.5, 0.4, 0.25]
            const h = size * heights[i] * 0.5
            const delay = i * 0.1
            return (
              <rect
                key={i}
                x={x - 2.5}
                y={-h / 2}
                width={5}
                height={h}
                rx={2.5}
                fill="url(#barGradient)"
                className={mounted ? 'opacity-100' : 'opacity-0'}
                style={{
                  transition: `opacity 0.5s ${delay}s, transform 0.3s`,
                  transformOrigin: 'center',
                }}
              />
            )
          })}
        </g>

        {/* Corner accent lines */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const r1 = size * 0.32
          const r2 = size * 0.38
          const x1 = size * 0.5 + Math.cos(rad) * r1
          const y1 = size * 0.5 + Math.sin(rad) * r1
          const x2 = size * 0.5 + Math.cos(rad) * r2
          const y2 = size * 0.5 + Math.sin(rad) * r2
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#accentGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              className={mounted ? 'opacity-70' : 'opacity-0'}
              style={{
                transition: `opacity 0.5s ${i * 0.08}s`,
              }}
            />
          )
        })}

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          
          <radialGradient id="innerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
          </radialGradient>
          
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Rotating outer ring */}
      {mounted && (
        <div
          className="absolute inset-0"
          style={{
            animation: 'spin 12s linear infinite',
          }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size * 0.46}
              fill="none"
              stroke="url(#hexGradient)"
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.3"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { enhancedAudioEngine } from '../audio/EnhancedAudioEngine'
import { usePerformanceStore } from '../state/performanceStore'
import type { EnhancedAudioFrame } from '../audio/types'

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [audioFrame, setAudioFrame] = useState<EnhancedAudioFrame | null>(null)
  const [calibration, setCalibration] = useState(enhancedAudioEngine.getCalibration())
  
  const performanceMetrics = usePerformanceStore((state) => ({
    currentFPS: state.currentFPS,
    averageFPS: state.averageFPS,
    isFullscreen: state.isFullscreen,
    qualityLevel: state.qualityLevel,
    effectiveDPR: state.effectiveDPR,
  }))

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      const frame = enhancedAudioEngine.getFrame()
      setAudioFrame(frame)
      setCalibration(enhancedAudioEngine.getCalibration())
    }, 100) // Update 10x per second

    return () => clearInterval(interval)
  }, [isOpen])

  // Toggle with keyboard shortcut (Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRecalibrate = () => {
    enhancedAudioEngine.startCalibration(2000)
  }

  const handleResetCalibration = () => {
    enhancedAudioEngine.resetCalibration()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-md bg-gray-800/80 px-3 py-2 text-xs text-white/70 hover:bg-gray-700/80 hover:text-white"
        title="Open Debug Panel (Ctrl+D)"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-80 bg-black/90 p-4 text-xs text-white shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-white">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/50 hover:text-white"
          title="Close (Ctrl+D)"
        >
          ×
        </button>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4 rounded-md bg-white/5 p-2">
        <h4 className="mb-2 font-semibold text-cyan-400">Performance</h4>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-white/60">Current FPS:</span>
            <span
              className={
                performanceMetrics.currentFPS >= 55
                  ? 'text-green-400'
                  : performanceMetrics.currentFPS >= 45
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }
            >
              {performanceMetrics.currentFPS}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Average FPS:</span>
            <span>{Math.round(performanceMetrics.averageFPS)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Quality:</span>
            <span className="font-semibold uppercase text-purple-400">
              {performanceMetrics.qualityLevel}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Effective DPR:</span>
            <span>{performanceMetrics.effectiveDPR.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Fullscreen:</span>
            <span>{performanceMetrics.isFullscreen ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      {/* Audio Metrics */}
      {audioFrame && (
        <div className="mb-4 rounded-md bg-white/5 p-2">
          <h4 className="mb-2 font-semibold text-cyan-400">Audio (Normalized)</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Bass:</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                    style={{ width: `${audioFrame.bassEnergyNorm * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right">{(audioFrame.bassEnergyNorm * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Mid:</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                    style={{ width: `${audioFrame.midEnergyNorm * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right">{(audioFrame.midEnergyNorm * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">High:</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                    style={{ width: `${audioFrame.highEnergyNorm * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right">{(audioFrame.highEnergyNorm * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Overall:</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                    style={{ width: `${audioFrame.overallVolumeNorm * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right">{(audioFrame.overallVolumeNorm * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Loudness:</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all"
                    style={{ width: `${audioFrame.perceivedLoudness * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right">{(audioFrame.perceivedLoudness * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transient Detection */}
      {audioFrame && (
        <div className="mb-4 rounded-md bg-white/5 p-2">
          <h4 className="mb-2 font-semibold text-cyan-400">Transient Detection</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-white/60">Is Transient:</span>
              <span className={audioFrame.isTransient ? 'text-green-400' : 'text-white/40'}>
                {audioFrame.isTransient ? 'YES' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Strength:</span>
              <span>{(audioFrame.transientStrength * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Peak:</span>
              <span>{(audioFrame.overallPeak * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Calibration */}
      <div className="rounded-md bg-white/5 p-2">
        <h4 className="mb-2 font-semibold text-cyan-400">Calibration</h4>
        <div className="mb-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-white/60">Status:</span>
            <span className={calibration.isCalibrated ? 'text-green-400' : 'text-yellow-400'}>
              {calibration.isCalibrated ? 'Calibrated' : 'Not Calibrated'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Noise Floor:</span>
            <span>{calibration.noiseFloor.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Peak RMS:</span>
            <span>{calibration.peakRMS.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Bass Gain:</span>
            <span>{calibration.bassGain.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Mid Gain:</span>
            <span>{calibration.midGain.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">High Gain:</span>
            <span>{calibration.highGain.toFixed(2)}x</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRecalibrate}
            className="flex-1 rounded bg-cyan-600 px-2 py-1 text-xs font-semibold hover:bg-cyan-500"
          >
            Recalibrate
          </button>
          <button
            onClick={handleResetCalibration}
            className="flex-1 rounded bg-gray-600 px-2 py-1 text-xs font-semibold hover:bg-gray-500"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 text-center text-[10px] text-white/40">Press Ctrl+D to toggle</div>
    </div>
  )
}


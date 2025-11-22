import type { AudioStatus } from '../state/types'
import { useAppStore } from '../state/useAppStore'
import { BeatDetector } from './BeatDetector'
import type { EnhancedAudioFrame, EnvelopeState } from './types'

const BASS_RANGE: [number, number] = [20, 250]
const MID_RANGE: [number, number] = [250, 2000]
const HIGH_RANGE: [number, number] = [2000, 16000]

interface AudioCalibration {
  noiseFloor: number
  peakRMS: number
  bassGain: number
  midGain: number
  highGain: number
  isCalibrated: boolean
}

class EnhancedAudioEngine {
  private context?: AudioContext
  private analyser?: AnalyserNode
  private gainNode?: GainNode
  private dataArray: Uint8Array = new Uint8Array(1024)
  private waveformArray: Uint8Array = new Uint8Array(2048)
  private stream?: MediaStream
  private audioElement?: HTMLAudioElement
  private mediaSource?: MediaElementAudioSourceNode
  private blobURL?: string
  private rafId?: number
  private beatDetector: BeatDetector = new BeatDetector()
  
  // Calibration state - more aggressive defaults for better sensitivity
  private calibration: AudioCalibration = {
    noiseFloor: 0.01, // Lower noise floor for quieter sounds
    peakRMS: 0.5, // Lower peak for better range utilization
    bassGain: 1.3,
    midGain: 1.4,
    highGain: 1.6,
    isCalibrated: false,
  }
  
  private calibrationSamples: number[] = []
  private isCalibrating: boolean = false
  
  // Envelope tracking
  private bassEnvelope: EnvelopeState = { fast: 0, slow: 0 }
  private midEnvelope: EnvelopeState = { fast: 0, slow: 0 }
  private highEnvelope: EnvelopeState = { fast: 0, slow: 0 }
  
  // Transient detection
  private loudnessHistory: number[] = []
  private readonly LOUDNESS_HISTORY_SIZE = 10
  
  // Peak tracking
  private peakValue: number = 0
  private peakDecay: number = 0.995
  
  // RMS history for percentile-based normalization
  private rmsHistory: number[] = []
  private readonly RMS_HISTORY_SIZE = 300 // ~5 seconds at 60fps
  
  private frame: EnhancedAudioFrame = {
    frequencyData: new Uint8Array(1024),
    waveformData: new Uint8Array(2048),
    bassEnergy: 0,
    midEnergy: 0,
    highEnergy: 0,
    overallVolume: 0,
    bassEnergyNorm: 0,
    midEnergyNorm: 0,
    highEnergyNorm: 0,
    overallVolumeNorm: 0,
    bassEnergyRaw: 0,
    midEnergyRaw: 0,
    highEnergyRaw: 0,
    transientStrength: 0,
    isTransient: false,
    perceivedLoudness: 0,
    bassEnvelope: { fast: 0, slow: 0 },
    midEnvelope: { fast: 0, slow: 0 },
    highEnvelope: { fast: 0, slow: 0 },
    overallPeak: 0,
  }

  async start() {
    if (this.context || this.stream) {
      if (this.context?.state === 'suspended') {
        await this.context.resume()
      }
      this.setStatus('listening')
      if (!this.rafId) {
        this.loop()
      }
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.setStatus('unsupported', 'Microphone access is not available in this browser.')
      return
    }

    this.setStatus('requesting')
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      })
      this.context = new AudioContext()
      const source = this.context.createMediaStreamSource(this.stream)
      
      this.gainNode = this.context.createGain()
      this.gainNode.gain.value = 2.2 // Increased for better sensitivity
      
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.7 // Slightly faster for transient detection
      this.analyser.minDecibels = -100 // Wider range for calibration
      this.analyser.maxDecibels = -10
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
      this.waveformArray = new Uint8Array(this.analyser.fftSize)
      
      source.connect(this.gainNode)
      this.gainNode.connect(this.analyser)

      if (this.context.state === 'suspended') {
        this.setStatus('suspended', 'Tap to activate the audio engine.')
      } else {
        this.setStatus('listening')
        this.loop()
        // Auto-calibrate after 2 seconds
        setTimeout(() => this.startCalibration(), 2000)
      }

      this.context.onstatechange = () => {
        if (!this.context) return
        if (this.context.state === 'running') {
          this.setStatus('listening')
          if (!this.rafId) {
            this.loop()
          }
        } else if (this.context.state === 'suspended') {
          this.setStatus('suspended', 'Audio context suspended. Tap to resume.')
        }
      }
    } catch (error) {
      const err = error as DOMException
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        this.setStatus('denied', 'Microphone permission is required to render visuals.')
      } else if (err.name === 'NotFoundError') {
        this.setStatus('error', 'No microphone was detected.')
      } else {
        this.setStatus('error', 'Unable to access microphone.')
      }
    }
  }

  async resume() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume()
      this.setStatus('listening')
      if (!this.rafId) {
        this.loop()
      }
    } else if (!this.context) {
      await this.start()
    }
  }

  stop() {
    cancelAnimationFrame(this.rafId ?? 0)
    this.rafId = undefined
    this.analyser?.disconnect()
    this.mediaSource?.disconnect()
    this.context?.close()
    this.stream?.getTracks().forEach((track) => track.stop())
    
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement = undefined
    }
    
    if (this.blobURL) {
      URL.revokeObjectURL(this.blobURL)
      this.blobURL = undefined
    }
    
    this.context = undefined
    this.analyser = undefined
    this.mediaSource = undefined
    this.stream = undefined
    this.dataArray = new Uint8Array(1024)
    this.waveformArray = new Uint8Array(2048)
    this.setStatus('idle')
  }

  getFrame(): EnhancedAudioFrame {
    return this.frame
  }

  // Calibration methods
  startCalibration(duration: number = 2000) {
    if (this.isCalibrating) return
    
    this.isCalibrating = true
    this.calibrationSamples = []
    
    console.log('[AudioEngine] Starting calibration...')
    
    setTimeout(() => {
      this.finishCalibration()
    }, duration)
  }

  private finishCalibration() {
    if (this.calibrationSamples.length < 10) {
      console.warn('[AudioEngine] Insufficient calibration samples')
      this.isCalibrating = false
      return
    }

    // Calculate noise floor (10th percentile)
    const sortedSamples = [...this.calibrationSamples].sort((a, b) => a - b)
    this.calibration.noiseFloor = sortedSamples[Math.floor(sortedSamples.length * 0.1)]
    
    // Calculate peak (95th percentile to avoid outliers)
    this.calibration.peakRMS = sortedSamples[Math.floor(sortedSamples.length * 0.95)]
    
    // Ensure minimum range
    if (this.calibration.peakRMS - this.calibration.noiseFloor < 0.1) {
      this.calibration.peakRMS = this.calibration.noiseFloor + 0.3
    }
    
    this.calibration.isCalibrated = true
    this.isCalibrating = false
    
    console.log('[AudioEngine] Calibration complete:', {
      noiseFloor: this.calibration.noiseFloor.toFixed(3),
      peakRMS: this.calibration.peakRMS.toFixed(3),
      range: (this.calibration.peakRMS - this.calibration.noiseFloor).toFixed(3),
    })
  }

  resetCalibration() {
    this.calibration = {
      noiseFloor: 0.01,
      peakRMS: 0.5,
      bassGain: 1.3,
      midGain: 1.4,
      highGain: 1.6,
      isCalibrated: false,
    }
    this.rmsHistory = []
    console.log('[AudioEngine] Calibration reset')
  }

  private loop = () => {
    if (!this.analyser) {
      return
    }

    this.rafId = requestAnimationFrame(this.loop)

    const freqBuffer = this.dataArray as Uint8Array<ArrayBuffer>
    const timeBuffer = this.waveformArray as Uint8Array<ArrayBuffer>

    this.analyser.getByteFrequencyData(freqBuffer)
    this.analyser.getByteTimeDomainData(timeBuffer)

    const sampleRate = this.context?.sampleRate ?? 44100
    const freqPerBin = sampleRate / 2 / this.dataArray.length

    // Compute band energy
    const computeBandEnergy = (range: [number, number]) => {
      const [min, max] = range
      const start = Math.max(0, Math.floor(min / freqPerBin))
      const end = Math.min(this.dataArray.length - 1, Math.ceil(max / freqPerBin))
      let sum = 0
      for (let i = start; i <= end; i += 1) {
        sum += this.dataArray[i]
      }
      return sum / (end - start + 1 || 1) / 255
    }

    // Compute RMS
    let rmsSum = 0
    for (let i = 0; i < this.waveformArray.length; i += 1) {
      const v = (this.waveformArray[i] - 128) / 128
      rmsSum += v * v
    }
    const currentRMS = Math.sqrt(rmsSum / this.waveformArray.length)

    // Track peak with decay
    this.peakValue = Math.max(currentRMS, this.peakValue * this.peakDecay)

    // Collect calibration samples
    if (this.isCalibrating) {
      this.calibrationSamples.push(currentRMS)
    }

    // Update RMS history
    this.rmsHistory.push(currentRMS)
    if (this.rmsHistory.length > this.RMS_HISTORY_SIZE) {
      this.rmsHistory.shift()
    }

    // Compute raw band energies
    const rawBass = computeBandEnergy(BASS_RANGE)
    const rawMid = computeBandEnergy(MID_RANGE)
    const rawHigh = computeBandEnergy(HIGH_RANGE)

    // Apply per-band gain normalization
    const bassNormalized = rawBass * this.calibration.bassGain
    const midNormalized = rawMid * this.calibration.midGain
    const highNormalized = rawHigh * this.calibration.highGain

    // Update attack/release envelopes
    const attackFactor = 0.35 // Fast attack
    const releaseFactor = 0.12 // Slower release
    
    this.updateEnvelope(this.bassEnvelope, bassNormalized, attackFactor, releaseFactor)
    this.updateEnvelope(this.midEnvelope, midNormalized, attackFactor, releaseFactor)
    this.updateEnvelope(this.highEnvelope, highNormalized, attackFactor, releaseFactor)

    // Normalize RMS to dynamic range
    const normalizedRMS = this.normalizeValue(currentRMS, this.calibration.noiseFloor, this.calibration.peakRMS)
    
    // Apply perceptual loudness curve (logarithmic)
    const perceivedLoudness = this.applyPerceptualCurve(normalizedRMS)

    // Transient detection
    this.loudnessHistory.push(perceivedLoudness)
    if (this.loudnessHistory.length > this.LOUDNESS_HISTORY_SIZE) {
      this.loudnessHistory.shift()
    }

    const recentAverage = this.loudnessHistory.slice(-5).reduce((sum, val) => sum + val, 0) / 5
    const slowerAverage = this.loudnessHistory.reduce((sum, val) => sum + val, 0) / this.loudnessHistory.length
    const transientStrength = Math.max(0, recentAverage - slowerAverage)
    const isTransient = transientStrength > 0.15

    // Beat detection
    const beatResult = this.beatDetector.detect(freqBuffer)

    // Normalize band energies
    const bassEnergyNorm = this.applyPerceptualCurve(this.normalizeValue(bassNormalized, 0, 1))
    const midEnergyNorm = this.applyPerceptualCurve(this.normalizeValue(midNormalized, 0, 1))
    const highEnergyNorm = this.applyPerceptualCurve(this.normalizeValue(highNormalized, 0, 1))

    this.frame = {
      frequencyData: freqBuffer,
      waveformData: timeBuffer,
      
      // Backward compatibility - use envelope fast values
      bassEnergy: this.bassEnvelope.fast,
      midEnergy: this.midEnvelope.fast,
      highEnergy: this.highEnvelope.fast,
      overallVolume: normalizedRMS,
      
      // Enhanced metrics
      bassEnergyNorm,
      midEnergyNorm,
      highEnergyNorm,
      overallVolumeNorm: normalizedRMS,
      
      bassEnergyRaw: rawBass,
      midEnergyRaw: rawMid,
      highEnergyRaw: rawHigh,
      
      transientStrength,
      isTransient,
      perceivedLoudness,
      
      bassEnvelope: { ...this.bassEnvelope },
      midEnvelope: { ...this.midEnvelope },
      highEnvelope: { ...this.highEnvelope },
      
      overallPeak: this.peakValue,
      beatInfo: beatResult,
    }
  }

  private updateEnvelope(envelope: EnvelopeState, target: number, attackFactor: number, releaseFactor: number) {
    const factor = target > envelope.fast ? attackFactor : releaseFactor
    envelope.fast += (target - envelope.fast) * factor
    envelope.slow += (target - envelope.slow) * (factor * 0.4) // Slower tracking
  }

  private normalizeValue(value: number, min: number, max: number): number {
    if (max <= min) return 0
    return Math.max(0, Math.min(1, (value - min) / (max - min)))
  }

  private applyPerceptualCurve(normalizedValue: number): number {
    // Logarithmic curve that's more sensitive at lower levels
    // Maps [0, 1] input to [0, 1] output with enhanced low-end sensitivity
    if (normalizedValue <= 0) return 0
    
    // Use a power curve with base < 1 to boost quiet sounds
    const enhanced = Math.pow(normalizedValue, 0.7)
    
    // Apply sigmoid-like curve for smooth transitions
    const x = enhanced * 2 - 1 // Map to [-1, 1]
    const sigmoid = x / (1 + Math.abs(x))
    
    // Map back to [0, 1]
    return (sigmoid + 1) / 2
  }

  async loadAudioFile(file: File): Promise<void> {
    try {
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop())
        this.stream = undefined
      }

      if (this.mediaSource) {
        this.mediaSource.disconnect()
        this.mediaSource = undefined
      }

      if (this.blobURL) {
        URL.revokeObjectURL(this.blobURL)
        this.blobURL = undefined
      }

      if (this.audioElement) {
        this.audioElement.pause()
        this.audioElement.src = ''
        this.audioElement = undefined
      }

      if (!this.context) {
        this.context = new AudioContext()
      }

      this.audioElement = new Audio()
      this.blobURL = URL.createObjectURL(file)
      this.audioElement.src = this.blobURL
      this.audioElement.loop = true

      if (!this.analyser) {
        this.analyser = this.context.createAnalyser()
        this.analyser.fftSize = 2048
        this.analyser.smoothingTimeConstant = 0.7
        this.analyser.minDecibels = -100
        this.analyser.maxDecibels = -10
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
        this.waveformArray = new Uint8Array(this.analyser.fftSize)
      }

      if (!this.gainNode) {
        this.gainNode = this.context.createGain()
        this.gainNode.gain.value = 2.2 // Increased for better sensitivity
      }

      this.mediaSource = this.context.createMediaElementSource(this.audioElement)
      this.mediaSource.connect(this.gainNode)
      this.gainNode.connect(this.analyser)
      this.analyser.connect(this.context.destination)

      await this.audioElement.play()

      this.setStatus('listening')
      if (!this.rafId) {
        this.loop()
      }

      // Auto-calibrate with file playback
      setTimeout(() => this.startCalibration(3000), 1000)

      console.log('[AudioEngine] Audio file loaded:', file.name)
    } catch (error) {
      console.error('[AudioEngine] Failed to load audio file:', error)
      this.setStatus('error', 'Failed to load audio file')
    }
  }

  getBeatInfo() {
    return this.frame.beatInfo
  }

  getBPM(): number {
    return this.beatDetector.getBPM()
  }

  setGain(value: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(3, value))
    }
  }

  getGain(): number {
    return this.gainNode?.gain.value ?? 1.0
  }

  getCalibration(): AudioCalibration {
    return { ...this.calibration }
  }

  private setStatus(status: AudioStatus, message?: string) {
    const { setAudioStatus } = useAppStore.getState()
    setAudioStatus(status, message)
  }
}

export const enhancedAudioEngine = new EnhancedAudioEngine()


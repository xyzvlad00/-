import type { AudioFrame, AudioStatus } from '../state/types'
import { useAppStore } from '../state/useAppStore'
import { BeatDetector } from './BeatDetector'

const BASS_RANGE: [number, number] = [20, 250]
const MID_RANGE: [number, number] = [250, 2000]
const HIGH_RANGE: [number, number] = [2000, 16000]

class AudioEngine {
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
  private smoothedBass: number = 0
  private smoothedMid: number = 0
  private smoothedHigh: number = 0
  private frame: AudioFrame = {
    frequencyData: new Uint8Array(1024),
    waveformData: new Uint8Array(2048),
    bassEnergy: 0,
    midEnergy: 0,
    highEnergy: 0,
    overallVolume: 0,
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
      
      // Create gain node for volume control
      this.gainNode = this.context.createGain()
      this.gainNode.gain.value = 1.0
      
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.75 // Slightly reduced for more responsiveness
      this.analyser.minDecibels = -90
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
    
    // Clean up audio file resources
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

  getFrame(): AudioFrame {
    return this.frame
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

    let rmsSum = 0
    for (let i = 0; i < this.waveformArray.length; i += 1) {
      const v = (this.waveformArray[i] - 128) / 128
      rmsSum += v * v
    }

    const beatResult = this.beatDetector.detect(freqBuffer)

    // Compute raw energies
    const rawBass = computeBandEnergy(BASS_RANGE)
    const rawMid = computeBandEnergy(MID_RANGE)
    const rawHigh = computeBandEnergy(HIGH_RANGE)

    // Apply smoothing for less jitter (exponential moving average)
    const smoothingFactor = 0.25
    this.smoothedBass += (rawBass - this.smoothedBass) * smoothingFactor
    this.smoothedMid += (rawMid - this.smoothedMid) * smoothingFactor
    this.smoothedHigh += (rawHigh - this.smoothedHigh) * smoothingFactor

    this.frame = {
      frequencyData: freqBuffer,
      waveformData: timeBuffer,
      bassEnergy: this.smoothedBass,
      midEnergy: this.smoothedMid,
      highEnergy: this.smoothedHigh,
      overallVolume: Math.sqrt(rmsSum / this.waveformArray.length),
      beatInfo: beatResult,
    }
  }

  async loadAudioFile(file: File): Promise<void> {
    try {
      // Stop any existing stream
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop())
        this.stream = undefined
      }

      // Clean up previous audio file resources
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

      // Create or reuse audio context
      if (!this.context) {
        this.context = new AudioContext()
      }

      // Create audio element with new blob URL
      this.audioElement = new Audio()
      this.blobURL = URL.createObjectURL(file)
      this.audioElement.src = this.blobURL
      this.audioElement.loop = true

      // Create analyser and gain node if needed
      if (!this.analyser) {
        this.analyser = this.context.createAnalyser()
        this.analyser.fftSize = 2048
        this.analyser.smoothingTimeConstant = 0.75
        this.analyser.minDecibels = -90
        this.analyser.maxDecibels = -10
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
        this.waveformArray = new Uint8Array(this.analyser.fftSize)
      }

      if (!this.gainNode) {
        this.gainNode = this.context.createGain()
        this.gainNode.gain.value = 1.0
      }

      // Connect audio element to analyser with gain control
      this.mediaSource = this.context.createMediaElementSource(this.audioElement)
      this.mediaSource.connect(this.gainNode)
      this.gainNode.connect(this.analyser)
      this.analyser.connect(this.context.destination)

      // Play audio
      await this.audioElement.play()

      this.setStatus('listening')
      if (!this.rafId) {
        this.loop()
      }

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
      // Clamp value between 0 and 3 for safety
      this.gainNode.gain.value = Math.max(0, Math.min(3, value))
    }
  }

  getGain(): number {
    return this.gainNode?.gain.value ?? 1.0
  }

  private setStatus(status: AudioStatus, message?: string) {
    const { setAudioStatus } = useAppStore.getState()
    setAudioStatus(status, message)
  }
}

export const audioEngine = new AudioEngine()


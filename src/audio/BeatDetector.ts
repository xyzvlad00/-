/**
 * Advanced beat detection algorithm
 * Uses energy-based detection with adaptive thresholding
 */

export interface BeatDetectionResult {
  isBeat: boolean
  confidence: number
  bpm: number
  energy: number
}

export class BeatDetector {
  private historySize: number
  private energyHistory: number[] = []
  private beatHistory: number[] = []
  private threshold: number
  private minThreshold: number
  private maxThreshold: number
  private variance: number = 0
  private lastBeatTime: number = 0
  private bpm: number = 0
  private bpmHistory: number[] = []

  constructor(
    historySize: number = 43,
    threshold: number = 1.5,
    minThreshold: number = 1.3,
    maxThreshold: number = 2.0,
  ) {
    this.historySize = historySize
    this.threshold = threshold
    this.minThreshold = minThreshold
    this.maxThreshold = maxThreshold
  }

  /**
   * Detect beat from audio frame
   */
  detect(frequencyData: Uint8Array): BeatDetectionResult {
    // Calculate instant energy (focus on bass/low-mid frequencies)
    const bassRange = Math.floor(frequencyData.length * 0.15) // 0-15% of spectrum
    let instantEnergy = 0

    for (let i = 0; i < bassRange; i++) {
      const normalized = frequencyData[i] / 255
      instantEnergy += normalized * normalized
    }

    instantEnergy /= bassRange

    // Add to history
    this.energyHistory.push(instantEnergy)
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift()
    }

    // Need enough history
    if (this.energyHistory.length < this.historySize) {
      return {
        isBeat: false,
        confidence: 0,
        bpm: 0,
        energy: instantEnergy,
      }
    }

    // Calculate average energy and variance
    const averageEnergy =
      this.energyHistory.reduce((sum, val) => sum + val, 0) / this.energyHistory.length

    this.variance = 0
    for (const energy of this.energyHistory) {
      this.variance += (energy - averageEnergy) * (energy - averageEnergy)
    }
    this.variance /= this.energyHistory.length

    // Adaptive threshold based on variance
    const adaptiveThreshold = Math.max(
      this.minThreshold,
      Math.min(this.maxThreshold, this.threshold + this.variance * 0.5),
    )

    // Detect beat
    const isBeat = instantEnergy > averageEnergy * adaptiveThreshold

    // Calculate confidence
    const confidence = isBeat
      ? Math.min((instantEnergy - averageEnergy * adaptiveThreshold) / averageEnergy, 1)
      : 0

    // BPM calculation
    const now = Date.now()
    if (isBeat && now - this.lastBeatTime > 200) {
      // Minimum 200ms between beats (max 300 BPM)
      const beatInterval = now - this.lastBeatTime
      const instantBPM = 60000 / beatInterval

      // Filter unrealistic BPM values (40-240 BPM)
      if (instantBPM >= 40 && instantBPM <= 240) {
        this.bpmHistory.push(instantBPM)
        if (this.bpmHistory.length > 8) {
          this.bpmHistory.shift()
        }

        // Calculate average BPM
        this.bpm = Math.round(
          this.bpmHistory.reduce((sum, val) => sum + val, 0) / this.bpmHistory.length,
        )
      }

      this.lastBeatTime = now
      this.beatHistory.push(now)
    }

    // Clean old beat history (keep last 10 seconds)
    this.beatHistory = this.beatHistory.filter((time) => now - time < 10000)

    return {
      isBeat,
      confidence,
      bpm: this.bpm,
      energy: instantEnergy,
    }
  }

  /**
   * Get current BPM
   */
  getBPM(): number {
    return this.bpm
  }

  /**
   * Get beat timing info
   */
  getBeatTiming(): {
    lastBeatTime: number
    timeSinceLastBeat: number
    beatsPerMinute: number
    beatPhase: number
  } {
    const now = Date.now()
    const timeSinceLastBeat = now - this.lastBeatTime
    const expectedInterval = this.bpm > 0 ? 60000 / this.bpm : 0
    const beatPhase = expectedInterval > 0 ? (timeSinceLastBeat % expectedInterval) / expectedInterval : 0

    return {
      lastBeatTime: this.lastBeatTime,
      timeSinceLastBeat,
      beatsPerMinute: this.bpm,
      beatPhase,
    }
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.energyHistory = []
    this.beatHistory = []
    this.bpmHistory = []
    this.lastBeatTime = 0
    this.bpm = 0
    this.variance = 0
  }
}


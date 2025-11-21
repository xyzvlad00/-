import { lazy } from 'react'
import type { VisualDefinition } from './types'

// Lazy load all visual components for better initial load performance
// Each visual mode is now loaded only when selected (all use default exports)
const BarsSpectrum = lazy(() => import('./modes/BarsSpectrum'))
const WaveformOscilloscope = lazy(() => import('./modes/WaveformOscilloscope'))
const RadialSpectrum = lazy(() => import('./modes/RadialSpectrum'))
const OrbitalParticles = lazy(() => import('./modes/OrbitalParticles'))
const FrequencyRings = lazy(() => import('./modes/FrequencyRings'))
const AudioGrid = lazy(() => import('./modes/AudioGrid'))
const KaleidoscopeMirror = lazy(() => import('./modes/KaleidoscopeMirror'))
const LiquidSurface = lazy(() => import('./modes/LiquidSurface'))
const Constellation = lazy(() => import('./modes/Constellation'))
const SpectrumCity = lazy(() => import('./modes/SpectrumCity'))
const MorphingKaleidoscope = lazy(() => import('./modes/MorphingKaleidoscope'))
const FluidDynamics = lazy(() => import('./modes/FluidDynamics'))
const TunnelVortex = lazy(() => import('./modes/TunnelVortex'))
const ParticleGalaxy = lazy(() => import('./modes/ParticleGalaxy'))
const ChromaticWaves = lazy(() => import('./modes/ChromaticWaves'))
const NeuralNetwork = lazy(() => import('./modes/NeuralNetwork'))
const DNAHelix = lazy(() => import('./modes/DNAHelix'))
const MatrixRain = lazy(() => import('./modes/MatrixRain'))

export const visualRegistry: VisualDefinition[] = [
  { id: 'morph-kaleid', name: 'Morphing Kaleidoscope', description: 'Geometry that transforms and rotates', Component: MorphingKaleidoscope },
  { id: 'fluid', name: 'Fluid Dynamics', description: 'Real-time fluid simulation with turbulence', Component: FluidDynamics },
  { id: 'tunnel', name: 'Vortex Tunnel', description: '3D perspective tunnel pulling you in', Component: TunnelVortex },
  { id: 'galaxy', name: 'Particle Galaxy', description: '3000 particles forming nebula clouds', Component: ParticleGalaxy },
  { id: 'chromatic', name: 'Chromatic Waves', description: 'RGB channel separation with interference', Component: ChromaticWaves },
  { id: 'neural', name: 'Neural Network', description: 'Synaptic connections lighting up', Component: NeuralNetwork },
  { id: 'bars', name: 'Spectrum Bars', description: 'Classic FFT bars with gradient glow', Component: BarsSpectrum },
  { id: 'waveform', name: 'Oscilloscope', description: 'Flowing waveform line with neon bloom', Component: WaveformOscilloscope },
  { id: 'radial', name: 'Radial Bloom', description: 'Circular spikes that pulse with loudness', Component: RadialSpectrum },
  { id: 'orbitals', name: 'Orbital Particles', description: 'Swarming particles driven by bands', Component: OrbitalParticles },
  { id: 'rings', name: 'Frequency Rings', description: 'Concentric rings mapped to bass/mid/high', Component: FrequencyRings },
  { id: 'grid', name: 'Reactive Grid', description: '3D grid tiles rising with audio', Component: AudioGrid },
  { id: 'kaleidoscope', name: 'Kaleidoscope', description: 'Mirrored shards rotating with bass', Component: KaleidoscopeMirror },
  { id: 'liquid', name: 'Liquid Aurora', description: 'Fluid shader ripples reacting to spectrum', Component: LiquidSurface },
  { id: 'constellation', name: 'Constellation', description: 'Starfield connections on transients', Component: Constellation },
  { id: 'city', name: 'Spectrum City', description: 'City skyline heights from frequency bands', Component: SpectrumCity },
  { id: 'dna', name: 'DNA Helix', description: 'Double helix structure with base pair connections', Component: DNAHelix },
  { id: 'matrix', name: 'Matrix Rain', description: 'Falling matrix code with beat detection', Component: MatrixRain },
]

export const getVisualById = (id: VisualDefinition['id']) => visualRegistry.find((visual) => visual.id === id) ?? visualRegistry[0]


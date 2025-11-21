import { lazy } from 'react'
import type { VisualDefinition } from './types'

// Lazy load all visual components for better initial load performance
// Each visual mode is now loaded only when selected
const BarsSpectrum = lazy(() => import('./modes/BarsSpectrum').then((m) => ({ default: m.BarsSpectrum })))
const WaveformOscilloscope = lazy(() => import('./modes/WaveformOscilloscope').then((m) => ({ default: m.WaveformOscilloscope })))
const RadialSpectrum = lazy(() => import('./modes/RadialSpectrum').then((m) => ({ default: m.RadialSpectrum })))
const OrbitalParticles = lazy(() => import('./modes/OrbitalParticles').then((m) => ({ default: m.OrbitalParticles })))
const FrequencyRings = lazy(() => import('./modes/FrequencyRings').then((m) => ({ default: m.FrequencyRings })))
const AudioGrid = lazy(() => import('./modes/AudioGrid').then((m) => ({ default: m.AudioGrid })))
const KaleidoscopeMirror = lazy(() => import('./modes/KaleidoscopeMirror').then((m) => ({ default: m.KaleidoscopeMirror })))
const LiquidSurface = lazy(() => import('./modes/LiquidSurface').then((m) => ({ default: m.LiquidSurface })))
const Constellation = lazy(() => import('./modes/Constellation').then((m) => ({ default: m.Constellation })))
const SpectrumCity = lazy(() => import('./modes/SpectrumCity').then((m) => ({ default: m.SpectrumCity })))
const GeometricPulse = lazy(() => import('./modes/GeometricPulse').then((m) => ({ default: m.GeometricPulse })))
const MorphingKaleidoscope = lazy(() => import('./modes/MorphingKaleidoscope').then((m) => ({ default: m.MorphingKaleidoscope })))
const FluidDynamics = lazy(() => import('./modes/FluidDynamics').then((m) => ({ default: m.FluidDynamics })))
const TunnelVortex = lazy(() => import('./modes/TunnelVortex').then((m) => ({ default: m.TunnelVortex })))
const ParticleGalaxy = lazy(() => import('./modes/ParticleGalaxy').then((m) => ({ default: m.ParticleGalaxy })))
const ChromaticWaves = lazy(() => import('./modes/ChromaticWaves').then((m) => ({ default: m.ChromaticWaves })))
const NeuralNetwork = lazy(() => import('./modes/NeuralNetwork').then((m) => ({ default: m.NeuralNetwork })))
const DNAHelix = lazy(() => import('./modes/DNAHelix').then((m) => ({ default: m.DNAHelix })))
const MatrixRain = lazy(() => import('./modes/MatrixRain').then((m) => ({ default: m.MatrixRain })))
const ParticleExplosion = lazy(() => import('./modes/ParticleExplosion').then((m) => ({ default: m.ParticleExplosion })))

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
  { id: 'geometric', name: 'Geometric Pulse', description: '3D pillars extruded by spectrum energy', Component: GeometricPulse },
  { id: 'dna', name: 'DNA Helix', description: 'Double helix structure with base pair connections', Component: DNAHelix },
  { id: 'matrix', name: 'Matrix Rain', description: 'Falling matrix code with beat detection', Component: MatrixRain },
  { id: 'explosion', name: 'Particle Explosion', description: '3D particle explosions on every beat', Component: ParticleExplosion },
]

export const getVisualById = (id: VisualDefinition['id']) => visualRegistry.find((visual) => visual.id === id) ?? visualRegistry[0]


import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'
import { getMobileOptimizedSettings } from '../../utils/mobile'

// 3D Neural Network with branching neurons, synaptic firing, and organic growth
const NEURON_COUNT = 80
const FIRING_SPEED = 0.05
const NEURON_LAYERS = 5

interface Neuron {
  mesh: THREE.Mesh
  position: THREE.Vector3
  layer: number
  connections: number[]
  activationLevel: number
  fireTime: number
  pulseSize: number
  hue: number
}

interface SynapticSignal {
  fromIndex: number
  toIndex: number
  progress: number
  strength: number
  mesh: THREE.Mesh
}

export function NeuralNetwork({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const neuronsRef = useRef<Neuron[]>([])
  const connectionsRef = useRef<THREE.Line[]>([])
  const signalsRef = useRef<SynapticSignal[]>([])
  const timeRef = useRef(0)

  const mobileSettings = getMobileOptimizedSettings()
  const effectiveNeuronCount = Math.floor(NEURON_COUNT * mobileSettings.particleReduction)

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.fog = new THREE.Fog(0x000510, 20, 100)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera
    camera.position.set(0, 0, 40)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: mobileSettings.quality !== 'low',
      alpha: true,
    })
    rendererRef.current = renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * mobileSettings.resolutionScale)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x303050, 0.6)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x00ffff, 1.5, 80)
    pointLight1.position.set(20, 20, 20)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff00ff, 1.5, 80)
    pointLight2.position.set(-20, -20, -20)
    scene.add(pointLight2)

    // Create neurons in layers
    const neuronGeometry = new THREE.SphereGeometry(0.4, 12, 12)
    const layerSpacing = 15
    const layerWidth = 12

    for (let layer = 0; layer < NEURON_LAYERS; layer++) {
      const neuronsInLayer = Math.floor(effectiveNeuronCount / NEURON_LAYERS)
      
      for (let i = 0; i < neuronsInLayer; i++) {
        const hue = (layer / NEURON_LAYERS + i * 0.1) % 1
        
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(hue, 0.8, 0.5),
          emissive: new THREE.Color().setHSL(hue, 1.0, 0.3),
          emissiveIntensity: 0.5,
          metalness: 0.3,
          roughness: 0.7,
        })

        const mesh = new THREE.Mesh(neuronGeometry, material)

        // Position in layer with some randomness
        const angle = (i / neuronsInLayer) * Math.PI * 2
        const radius = (layerWidth / 2) + (Math.random() - 0.5) * 3
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 4
        const z = (layer - NEURON_LAYERS / 2) * layerSpacing + (Math.random() - 0.5) * 3

        mesh.position.set(x, y, z)
        scene.add(mesh)

        neuronsRef.current.push({
          mesh,
          position: new THREE.Vector3(x, y, z),
          layer,
          connections: [],
          activationLevel: 0,
          fireTime: 0,
          pulseSize: 1,
          hue,
        })
      }
    }

    // Create connections between neurons (prefer connecting to next layer)
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      linewidth: 1,
    })

    neuronsRef.current.forEach((neuron, i) => {
      const maxConnections = 3 + Math.floor(Math.random() * 3)
      let connectionCount = 0

      // Prefer connecting to next layer
      for (let j = 0; j < neuronsRef.current.length && connectionCount < maxConnections; j++) {
        if (i === j) continue

        const other = neuronsRef.current[j]
        
        // Higher probability to connect to next layer
        const isNextLayer = other.layer === neuron.layer + 1
        const shouldConnect = isNextLayer ? Math.random() < 0.7 : Math.random() < 0.1

        if (shouldConnect) {
          const dist = neuron.position.distanceTo(other.position)
          if (dist < 25) {
            neuron.connections.push(j)

            const points = [neuron.position, other.position]
            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const line = new THREE.Line(geometry, connectionMaterial.clone())
            connectionsRef.current.push(line)
            scene.add(line)

            connectionCount++
          }
        }
      }
    })

    const handleResize = () => {
      if (!canvasRef.current || !camera || !renderer) return
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      neuronGeometry.dispose()
      connectionMaterial.dispose()
      neuronsRef.current.forEach(n => {
        n.mesh.geometry.dispose()
        if (!Array.isArray(n.mesh.material)) n.mesh.material.dispose()
      })
      connectionsRef.current.forEach(c => {
        c.geometry.dispose()
        if (!Array.isArray(c.material)) c.material.dispose()
      })
      signalsRef.current.forEach(s => {
        scene.remove(s.mesh)
        s.mesh.geometry.dispose()
        if (!Array.isArray(s.mesh.material)) s.mesh.material.dispose()
      })
      scene.clear()
    }
  }, [sensitivity, theme, effectiveNeuronCount, mobileSettings.quality, mobileSettings.resolutionScale])

  useCanvasLoop(
    canvasRef,
    (_ctx, dims, frame) => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

      const { width, height } = dims
      timeRef.current += 0.016

      if (rendererRef.current.domElement.width !== width || rendererRef.current.domElement.height !== height) {
        rendererRef.current.setSize(width, height)
        if (cameraRef.current) {
          cameraRef.current.aspect = width / height
          cameraRef.current.updateProjectionMatrix()
        }
      }

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // Trigger neuron firing based on frequency bands
      const neurons = neuronsRef.current
      if (neurons.length > 0) {
        // Fire neurons in different layers based on frequency bands
        const bassNeuronIndex = Math.floor((bassEnergy * 0.5) * neurons.length)
        const midNeuronIndex = Math.floor(((midEnergy * 0.5) + 0.25) * neurons.length)
        const highNeuronIndex = Math.floor(((highEnergy * 0.5) + 0.5) * neurons.length)

        if (bassEnergy > 0.3 && neurons[bassNeuronIndex]) {
          fireNeuron(bassNeuronIndex, bassEnergy, sceneRef.current!)
        }
        if (midEnergy > 0.3 && neurons[midNeuronIndex]) {
          fireNeuron(midNeuronIndex, midEnergy, sceneRef.current!)
        }
        if (highEnergy > 0.4 && neurons[highNeuronIndex]) {
          fireNeuron(highNeuronIndex, highEnergy, sceneRef.current!)
        }

        // Update neurons
        neurons.forEach((neuron, i) => {
          // Decay activation
          neuron.activationLevel *= 0.95
          neuron.pulseSize = 1 + neuron.activationLevel * 1.5

          // Update mesh
          neuron.mesh.scale.setScalar(neuron.pulseSize)

          const material = neuron.mesh.material as THREE.MeshStandardMaterial
          material.emissiveIntensity = 0.5 + neuron.activationLevel * 2.5
          material.opacity = 0.7 + neuron.activationLevel * 0.3

          // Slight floating motion
          neuron.mesh.position.x = neuron.position.x + Math.sin(timeRef.current * 0.5 + i) * 0.3
          neuron.mesh.position.y = neuron.position.y + Math.cos(timeRef.current * 0.4 + i) * 0.3

          // Update color based on activation
          const hue = (neuron.hue + timeRef.current * 0.02 + neuron.activationLevel * 0.1) % 1
          material.color.setHSL(hue, 0.8, 0.5 + neuron.activationLevel * 0.3)
          material.emissive.setHSL(hue, 1.0, 0.3 + neuron.activationLevel * 0.4)
        })

        // Update connections
        connectionsRef.current.forEach((line, i) => {
          const material = line.material as THREE.LineBasicMaterial
          material.opacity = 0.1 + midEnergy * 0.3
          material.color.setHSL((timeRef.current * 0.05 + i * 0.01) % 1, 0.8, 0.6)
        })

        // Update synaptic signals
        const updatedSignals: SynapticSignal[] = []
        signalsRef.current.forEach(signal => {
          signal.progress += FIRING_SPEED * (1 + highEnergy)

          if (signal.progress >= 1) {
            // Signal reached destination - activate target neuron
            const targetNeuron = neurons[signal.toIndex]
            if (targetNeuron) {
              targetNeuron.activationLevel = Math.min(1, targetNeuron.activationLevel + signal.strength)
              targetNeuron.fireTime = timeRef.current

              // Propagate signal to connected neurons
              if (Math.random() < 0.5) {
                fireNeuron(signal.toIndex, signal.strength * 0.7, sceneRef.current!)
              }
            }

            // Remove signal
            sceneRef.current!.remove(signal.mesh)
            signal.mesh.geometry.dispose()
            if (!Array.isArray(signal.mesh.material)) signal.mesh.material.dispose()
          } else {
            // Update signal position
            const from = neurons[signal.fromIndex].position
            const to = neurons[signal.toIndex].position
            signal.mesh.position.lerpVectors(from, to, signal.progress)

            // Update signal appearance
            const material = signal.mesh.material as THREE.MeshBasicMaterial
            material.opacity = (1 - signal.progress) * 0.8
            signal.mesh.scale.setScalar(1 + signal.strength * 2)

            updatedSignals.push(signal)
          }
        })
        signalsRef.current = updatedSignals
      }

      // Camera movement
      cameraRef.current.position.x = Math.sin(timeRef.current * 0.1) * 20
      cameraRef.current.position.y = Math.cos(timeRef.current * 0.08) * 10
      cameraRef.current.lookAt(0, 0, 0)

      // Light movement
      const lights = sceneRef.current.children.filter(c => c instanceof THREE.PointLight) as THREE.PointLight[]
      if (lights[0]) {
        lights[0].intensity = 1.5 + bassEnergy * 2
        lights[0].color.setHSL((timeRef.current * 0.1) % 1, 1, 0.7)
      }
      if (lights[1]) {
        lights[1].intensity = 1.5 + midEnergy * 2
        lights[1].color.setHSL((timeRef.current * 0.1 + 0.5) % 1, 1, 0.7)
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)
    },
    [sensitivity, theme],
  )

  // Fire a neuron and send signals to connected neurons
  function fireNeuron(index: number, strength: number, scene: THREE.Scene) {
    const neuron = neuronsRef.current[index]
    if (!neuron) return

    neuron.activationLevel = Math.min(1, strength)
    neuron.fireTime = timeRef.current

    // Send signals to connected neurons
    neuron.connections.forEach(targetIndex => {
      const signalGeometry = new THREE.SphereGeometry(0.3, 8, 8)
      const signalMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(neuron.hue, 1, 0.7),
        transparent: true,
        opacity: 0.8,
      })
      const signalMesh = new THREE.Mesh(signalGeometry, signalMaterial)
      signalMesh.position.copy(neuron.position)
      scene.add(signalMesh)

      signalsRef.current.push({
        fromIndex: index,
        toIndex: targetIndex,
        progress: 0,
        strength: strength * 0.8,
        mesh: signalMesh,
      })
    })
  }

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

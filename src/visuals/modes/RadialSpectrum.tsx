import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'

// 3D Circular Equalizer - 360° immersive spectrum
export function RadialSpectrum({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const barsGroupRef = useRef<THREE.Group | null>(null)
  const innerRingRef = useRef<THREE.Mesh | null>(null)
  const outerRingsRef = useRef<THREE.Mesh[]>([])
  const timeRef = useRef(0)

  const NUM_BARS = 256
  const CIRCLE_RADIUS = 15
  const MAX_BAR_HEIGHT = 12

  useEffect(() => {
    if (!canvasRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.fog = new THREE.Fog(0x000000, 5, 50)

    // Camera setup - positioned inside the circle looking outward
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
    cameraRef.current = camera
    camera.position.set(0, 3, 0) // Slightly elevated inside the circle

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    })
    rendererRef.current = renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 2, 50)
    pointLight.position.set(0, 5, 0)
    scene.add(pointLight)

    // Create bars group
    const barsGroup = new THREE.Group()
    barsGroupRef.current = barsGroup
    scene.add(barsGroup)

    // Create spectrum bars in a circle
    for (let i = 0; i < NUM_BARS; i++) {
      const angle = (i / NUM_BARS) * Math.PI * 2
      
      // Bar geometry - tall thin box
      const geometry = new THREE.BoxGeometry(0.15, 1, 0.3)
      const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.4,
      })
      
      const bar = new THREE.Mesh(geometry, material)
      
      // Position bars in a circle
      const x = Math.cos(angle) * CIRCLE_RADIUS
      const z = Math.sin(angle) * CIRCLE_RADIUS
      bar.position.set(x, 0, z)
      
      // Rotate bars to face center
      bar.rotation.y = -angle
      
      barsGroup.add(bar)
    }

    // Create inner glowing ring (floor)
    const ringGeometry = new THREE.RingGeometry(2, 3, 64)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    })
    const innerRing = new THREE.Mesh(ringGeometry, ringMaterial)
    innerRingRef.current = innerRing
    innerRing.rotation.x = -Math.PI / 2
    innerRing.position.y = -0.5
    scene.add(innerRing)

    // Create outer rings (ceiling tiers)
    for (let i = 0; i < 3; i++) {
      const outerRingGeometry = new THREE.TorusGeometry(CIRCLE_RADIUS + i * 2, 0.1, 16, 64)
      const outerRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.4 - i * 0.1,
      })
      const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial)
      outerRing.rotation.x = Math.PI / 2
      outerRing.position.y = 8 + i * 3
      scene.add(outerRing)
      outerRingsRef.current.push(outerRing)
    }

    // Resize handler
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && canvasRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      scene.clear()
    }
  }, [])

  useCanvasLoop(
    canvasRef,
    (_ctx, dims, frame) => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !barsGroupRef.current) return

      const { width, height } = dims
      timeRef.current += 0.016

      // Update renderer size if needed
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

      // Rotate camera slowly for 360° view
      cameraRef.current.rotation.y = Math.sin(timeRef.current * 0.1) * 0.3 + timeRef.current * 0.05

      // Update bars
      const bars = barsGroupRef.current.children
      const step = Math.max(1, Math.floor(frame.frequencyData.length / NUM_BARS))

      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as THREE.Mesh
        const freqValue = frame.frequencyData[Math.min(i * step, frame.frequencyData.length - 1)] / 255

        // Frequency-zone easing
        let easedMag: number
        const freqZone = i / NUM_BARS

        if (freqZone < 0.2) {
          easedMag = Math.pow(freqValue, 0.8) * (1 + bassEnergy * 0.6)
        } else if (freqZone < 0.7) {
          easedMag = Math.pow(freqValue, 1.0) * (1 + midEnergy * 0.4)
        } else {
          easedMag = Math.pow(freqValue, 1.2) * (1 + highEnergy * 0.5)
        }

        // Scale bar height
        const targetHeight = 0.5 + easedMag * MAX_BAR_HEIGHT * sensitivity
        bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetHeight, 0.25)

        // Position bars to grow upward
        bar.position.y = (bar.scale.y * 1) / 2

        // Dynamic color based on frequency zone and magnitude
        const hue = (freqZone * 0.8 + timeRef.current * 0.05 + easedMag * 0.2) % 1
        const color = new THREE.Color().setHSL(hue, 0.9, 0.5 + easedMag * 0.3)
        const material = bar.material as THREE.MeshStandardMaterial
        material.color = color
        material.emissive = color
        material.emissiveIntensity = 0.3 + easedMag * 0.7
      }

      // Update inner ring
      if (innerRingRef.current) {
        const innerMaterial = innerRingRef.current.material as THREE.MeshBasicMaterial
        const innerHue = (timeRef.current * 0.1) % 1
        innerMaterial.color.setHSL(innerHue, 0.9, 0.5)
        innerMaterial.opacity = 0.4 + bassEnergy * 0.4
        innerRingRef.current.rotation.z = timeRef.current * 0.2
        innerRingRef.current.scale.set(1 + bassEnergy * 0.3, 1 + bassEnergy * 0.3, 1)
      }

      // Update outer rings
      outerRingsRef.current.forEach((ring, index) => {
        const material = ring.material as THREE.MeshBasicMaterial
        const hue = (timeRef.current * 0.08 + index * 0.2) % 1
        material.color.setHSL(hue, 0.85, 0.6)
        material.opacity = (0.3 - index * 0.08) + midEnergy * 0.2
        ring.rotation.z = timeRef.current * (0.1 + index * 0.05) * (index % 2 === 0 ? 1 : -1)
        ring.position.y = 8 + index * 3 + Math.sin(timeRef.current + index) * highEnergy * 2
      })

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    },
    [sensitivity],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { VisualComponentProps } from '../types'
import { audioEngine } from '../../audio/AudioEngine'

// 3D Particle Explosion with Three.js
interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
  initialColor: THREE.Color
}

// Store particles globally per instance
const particlesMap = new Map<HTMLCanvasElement, Particle[]>()

export function ParticleExplosion({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const timeRef = useRef(0)
  const explosionTimeRef = useRef(0)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize particles array for this canvas
    if (!particlesMap.has(canvasRef.current)) {
      particlesMap.set(canvasRef.current, [])
    }
    const particles = particlesMap.get(canvasRef.current)!

    // Setup Three.js scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(theme === 'dark' ? 0x000510 : 0xf0f0f5, 50, 200)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 80
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x40f3ff, 1, 100)
    pointLight1.position.set(30, 30, 30)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff70cb, 1, 100)
    pointLight2.position.set(-30, -30, 30)
    scene.add(pointLight2)

    // Animation loop
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const frame = audioEngine.getFrame()
      const bassEnergy = Math.pow(frame.bassEnergy, 0.7) * sensitivity
      const midEnergy = Math.pow(frame.midEnergy, 0.8) * sensitivity
      const highEnergy = Math.pow(frame.highEnergy, 0.9) * sensitivity

      timeRef.current += 0.016

      // Trigger explosion on beat
      const beatInfo = frame.beatInfo
      if (beatInfo?.isBeat && beatInfo.confidence > 0.6) {
        explosionTimeRef.current = timeRef.current
        createExplosion(scene, bassEnergy, midEnergy, particles)
      }

      // Update particles
      const updatedParticles = particles.filter((particle) => {
        particle.life += 0.016
        const lifeRatio = particle.life / particle.maxLife

        if (lifeRatio >= 1) {
          scene.remove(particle.mesh)
          particle.mesh.geometry.dispose()
          ;(particle.mesh.material as THREE.Material).dispose()
          return false
        }

        // Update position
        particle.mesh.position.add(particle.velocity)
        
        // Apply gravity and drag
        particle.velocity.y -= 0.02
        particle.velocity.multiplyScalar(0.99)

        // Scale and fade
        const scale = 1 - lifeRatio
        particle.mesh.scale.set(scale, scale, scale)

        const material = particle.mesh.material as THREE.MeshStandardMaterial
        material.opacity = 1 - lifeRatio
        material.emissiveIntensity = (1 - lifeRatio) * (0.5 + highEnergy * 0.5)

        return true
      })
      
      particlesMap.set(canvasRef.current!, updatedParticles)

      // Camera movement based on audio
      camera.position.x = Math.sin(timeRef.current * 0.3) * 10 * midEnergy
      camera.position.y = Math.cos(timeRef.current * 0.2) * 8 * midEnergy
      camera.lookAt(0, 0, 0)

      // Light pulsing
      pointLight1.intensity = 1 + bassEnergy * 2
      pointLight2.intensity = 1 + highEnergy * 2

      // Ambient particles
      if (Math.random() > 0.95 - highEnergy * 0.3) {
        createAmbientParticle(scene, highEnergy, particles)
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !camera || !renderer) return

      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)

      // Cleanup
      if (canvasRef.current && particlesMap.has(canvasRef.current)) {
        const particles = particlesMap.get(canvasRef.current)!
        particles.forEach((particle) => {
          scene.remove(particle.mesh)
          particle.mesh.geometry.dispose()
          ;(particle.mesh.material as THREE.Material).dispose()
        })
        particlesMap.delete(canvasRef.current)
      }

      renderer.dispose()
    }
  }, [sensitivity, theme])

  return (
    <canvas
      ref={canvasRef}
      className="block h-full min-h-[420px] w-full rounded-3xl bg-gradient-to-b from-black/50 to-black/80"
    />
  )
}

function createExplosion(scene: THREE.Scene, bassEnergy: number, midEnergy: number, particles: Particle[]) {
  const particleCount = Math.floor(50 + bassEnergy * 100)
  const geometry = new THREE.SphereGeometry(0.5, 8, 8)

  for (let i = 0; i < particleCount; i++) {
    const hue = (i / particleCount + Math.random() * 0.2) % 1
    const color = new THREE.Color().setHSL(hue, 0.9, 0.6)

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 1,
    })

    const mesh = new THREE.Mesh(geometry, material)

    // Random direction
    const phi = Math.random() * Math.PI * 2
    const theta = Math.random() * Math.PI
    const speed = 0.5 + bassEnergy * 2 + Math.random() * 1.5

    const velocity = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi) * speed,
      Math.sin(theta) * Math.sin(phi) * speed,
      Math.cos(theta) * speed,
    )

    mesh.position.set(0, 0, 0)
    scene.add(mesh)

    particles.push({
      mesh,
      velocity,
      life: 0,
      maxLife: 2 + midEnergy * 2,
      initialColor: color,
    })
  }
}

function createAmbientParticle(scene: THREE.Scene, highEnergy: number, particles: Particle[]) {
  const geometry = new THREE.SphereGeometry(0.3, 6, 6)
  const hue = Math.random()
  const color = new THREE.Color().setHSL(hue, 0.8, 0.6)

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 1,
  })

  const mesh = new THREE.Mesh(geometry, material)

  // Random position in sphere
  const radius = 50 + Math.random() * 30
  const phi = Math.random() * Math.PI * 2
  const theta = Math.random() * Math.PI

  mesh.position.set(
    Math.sin(theta) * Math.cos(phi) * radius,
    Math.sin(theta) * Math.sin(phi) * radius,
    Math.cos(theta) * radius,
  )

  scene.add(mesh)

  particles.push({
    mesh,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
    ),
    life: 0,
    maxLife: 1.5 + highEnergy,
    initialColor: color,
  })
}


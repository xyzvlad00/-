import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { VisualComponentProps } from '../types'
import { audioEngine } from '../../audio/AudioEngine'

// Professional 3D Particle Explosion with enhanced audio sync
interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
  initialColor: THREE.Color
  rotationSpeed: THREE.Vector3
  trail?: THREE.Line
  trailPoints: THREE.Vector3[]
}

interface Shockwave {
  mesh: THREE.Mesh
  life: number
  maxLife: number
  initialScale: number
}

const particlesMap = new Map<HTMLCanvasElement, Particle[]>()
const shockwavesMap = new Map<HTMLCanvasElement, Shockwave[]>()

export function ParticleExplosion({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const timeRef = useRef(0)
  const lastBeatRef = useRef(0)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize arrays for this canvas
    if (!particlesMap.has(canvasRef.current)) {
      particlesMap.set(canvasRef.current, [])
      shockwavesMap.set(canvasRef.current, [])
    }
    const particles = particlesMap.get(canvasRef.current)!
    const shockwaves = shockwavesMap.get(canvasRef.current)!

    // Scene setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000510, 30, 150)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 50
    camera.position.y = 10
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 120)
    pointLight1.position.set(40, 40, 40)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 120)
    pointLight2.position.set(-40, -20, 40)
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0xffff00, 1.5, 100)
    pointLight3.position.set(0, 50, 0)
    scene.add(pointLight3)

    // Particle geometries pool
    const geometries = [
      new THREE.SphereGeometry(0.6, 8, 8),
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.TetrahedronGeometry(0.8, 0),
      new THREE.OctahedronGeometry(0.7, 0),
      new THREE.IcosahedronGeometry(0.6, 0),
    ]

    // Animation loop
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const frame = audioEngine.getFrame()
      const bassEnergy = Math.pow(frame.bassEnergy, 0.7) * sensitivity
      const midEnergy = Math.pow(frame.midEnergy, 0.85) * sensitivity
      const highEnergy = Math.pow(frame.highEnergy, 0.95) * sensitivity

      timeRef.current += 0.016

      // Beat-triggered explosion with proper debouncing
      if (frame.beatInfo?.isBeat && frame.beatInfo.confidence > 0.5 && timeRef.current - lastBeatRef.current > 0.15) {
        lastBeatRef.current = timeRef.current
        createExplosion(scene, bassEnergy, midEnergy, highEnergy, particles, geometries)
        createShockwave(scene, bassEnergy, shockwaves)
      }

      // Frequency-triggered small bursts
      if (highEnergy > 0.7 && Math.random() > 0.85) {
        createFrequencyBurst(scene, highEnergy, particles, geometries)
      }

      // Update particles
      const updatedParticles = particles.filter((particle) => {
        particle.life += 0.016
        const lifeRatio = particle.life / particle.maxLife

        if (lifeRatio >= 1) {
          scene.remove(particle.mesh)
          particle.mesh.geometry.dispose()
          ;(particle.mesh.material as THREE.Material).dispose()
          if (particle.trail) {
            scene.remove(particle.trail)
            particle.trail.geometry.dispose()
            ;(particle.trail.material as THREE.Material).dispose()
          }
          return false
        }

        // Update position with physics
        particle.mesh.position.add(particle.velocity)
        
        // Gravity and drag
        particle.velocity.y -= 0.025
        particle.velocity.multiplyScalar(0.985)

        // Rotation
        particle.mesh.rotation.x += particle.rotationSpeed.x
        particle.mesh.rotation.y += particle.rotationSpeed.y
        particle.mesh.rotation.z += particle.rotationSpeed.z

        // Scale and fade
        const scale = Math.max(0, 1 - lifeRatio * 0.8)
        particle.mesh.scale.set(scale, scale, scale)

        const material = particle.mesh.material as THREE.MeshStandardMaterial
        material.opacity = Math.max(0, 1 - lifeRatio)
        material.emissiveIntensity = (1 - lifeRatio) * (0.6 + highEnergy * 0.8)

        // Update trail
        if (particle.trail) {
          particle.trailPoints.push(particle.mesh.position.clone())
          if (particle.trailPoints.length > 10) {
            particle.trailPoints.shift()
          }
          particle.trail.geometry.setFromPoints(particle.trailPoints)
          const trailMaterial = particle.trail.material as THREE.LineBasicMaterial
          trailMaterial.opacity = material.opacity * 0.5
        }

        return true
      })
      
      particlesMap.set(canvasRef.current!, updatedParticles)

      // Update shockwaves
      const updatedShockwaves = shockwaves.filter((shockwave) => {
        shockwave.life += 0.016
        const lifeRatio = shockwave.life / shockwave.maxLife

        if (lifeRatio >= 1) {
          scene.remove(shockwave.mesh)
          shockwave.mesh.geometry.dispose()
          ;(shockwave.mesh.material as THREE.Material).dispose()
          return false
        }

        // Expand shockwave
        const scale = shockwave.initialScale + lifeRatio * 20
        shockwave.mesh.scale.set(scale, scale, scale)

        // Fade out
        const material = shockwave.mesh.material as THREE.MeshBasicMaterial
        material.opacity = Math.max(0, 1 - lifeRatio * 1.2)

        return true
      })

      shockwavesMap.set(canvasRef.current!, updatedShockwaves)

      // Dynamic camera movement
      camera.position.x = Math.sin(timeRef.current * 0.2) * (12 + midEnergy * 10)
      camera.position.y = 10 + Math.cos(timeRef.current * 0.15) * (8 + midEnergy * 8)
      camera.position.z = 50 + Math.sin(timeRef.current * 0.1) * (5 + bassEnergy * 10)
      camera.lookAt(0, 0, 0)

      // Dynamic lighting
      pointLight1.intensity = 2 + bassEnergy * 4
      pointLight2.intensity = 2 + midEnergy * 4
      pointLight3.intensity = 1.5 + highEnergy * 3.5

      const lightHue = (timeRef.current * 0.1) % 1
      pointLight1.color.setHSL(lightHue, 1, 0.6)
      pointLight2.color.setHSL((lightHue + 0.33) % 1, 1, 0.6)
      pointLight3.color.setHSL((lightHue + 0.66) % 1, 1, 0.6)

      // Light orbit
      pointLight1.position.x = Math.cos(timeRef.current * 0.5) * 40
      pointLight1.position.z = Math.sin(timeRef.current * 0.5) * 40
      pointLight2.position.x = Math.cos(timeRef.current * 0.5 + Math.PI) * 40
      pointLight2.position.z = Math.sin(timeRef.current * 0.5 + Math.PI) * 40

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
      if (canvasRef.current) {
        if (particlesMap.has(canvasRef.current)) {
          const particles = particlesMap.get(canvasRef.current)!
          particles.forEach((particle) => {
            scene.remove(particle.mesh)
            particle.mesh.geometry.dispose()
            ;(particle.mesh.material as THREE.Material).dispose()
            if (particle.trail) {
              scene.remove(particle.trail)
              particle.trail.geometry.dispose()
              ;(particle.trail.material as THREE.Material).dispose()
            }
          })
          particlesMap.delete(canvasRef.current)
        }
        if (shockwavesMap.has(canvasRef.current)) {
          const shockwaves = shockwavesMap.get(canvasRef.current)!
          shockwaves.forEach((shockwave) => {
            scene.remove(shockwave.mesh)
            shockwave.mesh.geometry.dispose()
            ;(shockwave.mesh.material as THREE.Material).dispose()
          })
          shockwavesMap.delete(canvasRef.current)
        }
      }

      geometries.forEach(geo => geo.dispose())
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

function createExplosion(
  scene: THREE.Scene,
  bassEnergy: number,
  midEnergy: number,
  highEnergy: number,
  particles: Particle[],
  geometries: THREE.BufferGeometry[]
) {
  const particleCount = Math.floor(60 + bassEnergy * 150 + highEnergy * 20) // Use highEnergy

  for (let i = 0; i < particleCount; i++) {
    const hue = (i / particleCount + Math.random() * 0.15) % 1
    const color = new THREE.Color().setHSL(hue, 0.9 + Math.random() * 0.1, 0.5 + Math.random() * 0.2)

    // Random geometry type
    const geometry = geometries[Math.floor(Math.random() * geometries.length)]

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.9,
      metalness: 0.4,
      roughness: 0.6,
      transparent: true,
      opacity: 1,
    })

    const mesh = new THREE.Mesh(geometry, material)

    // Spherical explosion
    const phi = Math.random() * Math.PI * 2
    const theta = Math.random() * Math.PI
    const speed = 0.8 + bassEnergy * 3 + Math.random() * 2

    const velocity = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi) * speed,
      Math.sin(theta) * Math.sin(phi) * speed,
      Math.cos(theta) * speed,
    )

    mesh.position.set(0, 0, 0)
    const randomScale = 0.6 + Math.random() * 0.8
    mesh.scale.set(randomScale, randomScale, randomScale)
    scene.add(mesh)

    // Create trail for fast particles
    let trail: THREE.Line | undefined
    const trailPoints: THREE.Vector3[] = []
    if (speed > 2) {
      trailPoints.push(mesh.position.clone())
      const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints)
      const trailMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        linewidth: 2,
      })
      trail = new THREE.Line(trailGeometry, trailMaterial)
      scene.add(trail)
    }

    particles.push({
      mesh,
      velocity,
      life: 0,
      maxLife: 2 + midEnergy * 2.5,
      initialColor: color,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ),
      trail,
      trailPoints,
    })
  }
}

function createShockwave(scene: THREE.Scene, bassEnergy: number, shockwaves: Shockwave[]) {
  const geometry = new THREE.RingGeometry(0.5, 1, 32)
  const hue = Math.random()
  const color = new THREE.Color().setHSL(hue, 0.9, 0.6)

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = Math.PI / 2
  scene.add(mesh)

  shockwaves.push({
    mesh,
    life: 0,
    maxLife: 1.2 + bassEnergy * 0.8,
    initialScale: 1 + bassEnergy * 2,
  })
}

function createFrequencyBurst(
  scene: THREE.Scene,
  _highEnergy: number, // Prefixed with underscore to indicate intentionally unused
  particles: Particle[],
  geometries: THREE.BufferGeometry[]
) {
  const highEnergy = _highEnergy // Use the parameter
  const particleCount = Math.floor(15 + highEnergy * 30)

  for (let i = 0; i < particleCount; i++) {
    const hue = (Math.random() * 0.2 + 0.5) % 1 // Focus on cool colors
    const color = new THREE.Color().setHSL(hue, 1, 0.6)

    const geometry = geometries[0] // Spheres for frequency bursts

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 1,
    })

    const mesh = new THREE.Mesh(geometry, material)

    // Upward spray
    const angle = Math.random() * Math.PI * 2
    const spread = 0.5
    const velocity = new THREE.Vector3(
      Math.cos(angle) * Math.random() * spread,
      1 + highEnergy * 2 + Math.random(),
      Math.sin(angle) * Math.random() * spread,
    )

    mesh.position.set(0, -10, 0)
    const randomScale = 0.4 + Math.random() * 0.4
    mesh.scale.set(randomScale, randomScale, randomScale)
    scene.add(mesh)

    particles.push({
      mesh,
      velocity,
      life: 0,
      maxLife: 1.5 + Math.random() * 0.5,
      initialColor: color,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.15
      ),
      trailPoints: [],
    })
  }
}

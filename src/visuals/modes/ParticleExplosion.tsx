import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { VisualComponentProps } from '../types'
import { audioEngine } from '../../audio/AudioEngine'

// ULTRA-PROFESSIONAL 3D Particle Fireworks - Spectacular beat-synced explosions
interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  life: number
  maxLife: number
  color: THREE.Color
  rotationSpeed: THREE.Vector3
  trail: THREE.Line
  trailPoints: THREE.Vector3[]
  sparkles: THREE.Points[]
}

interface Firework {
  particles: Particle[]
  center: THREE.Vector3
  life: number
}

const fireworksMap = new Map<HTMLCanvasElement, Firework[]>()
const MAX_FIREWORKS = 5
const PARTICLES_PER_FIREWORK = 300

export function ParticleExplosion({ sensitivity }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const timeRef = useRef(0)
  const lastBeatRef = useRef(0)

  useEffect(() => {
    if (!canvasRef.current) return

    if (!fireworksMap.has(canvasRef.current)) {
      fireworksMap.set(canvasRef.current, [])
    }
    const fireworks = fireworksMap.get(canvasRef.current)!

    // Scene setup with dramatic black background
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(0x000000, 40, 200)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 60
    camera.position.y = 0
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    // Dramatic lighting
    const ambientLight = new THREE.AmbientLight(0x111111, 0.3)
    scene.add(ambientLight)

    const lights: THREE.PointLight[] = []
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(0xffffff, 3, 150)
      lights.push(light)
      scene.add(light)
    }

    // Particle geometries
    const sphereGeo = new THREE.SphereGeometry(0.8, 8, 8)
    const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2)
    const tetraGeo = new THREE.TetrahedronGeometry(1, 0)
    const geometries = [sphereGeo, boxGeo, tetraGeo]

    // Animation loop
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const frame = audioEngine.getFrame()
      const bassEnergy = Math.pow(frame.bassEnergy, 0.65) * sensitivity
      const midEnergy = Math.pow(frame.midEnergy, 0.8) * sensitivity
      const highEnergy = Math.pow(frame.highEnergy, 0.9) * sensitivity

      timeRef.current += 0.016

      // BEAT-TRIGGERED MASSIVE FIREWORK EXPLOSION
      if (frame.beatInfo?.isBeat && frame.beatInfo.confidence > 0.4 && timeRef.current - lastBeatRef.current > 0.2) {
        lastBeatRef.current = timeRef.current

        if (fireworks.length < MAX_FIREWORKS) {
          // Create spectacular firework
          const firework: Firework = {
            particles: [],
            center: new THREE.Vector3(
              (Math.random() - 0.5) * 40,
              (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 20
            ),
            life: 0,
          }

          const baseHue = Math.random()
          const explosionStrength = 2 + bassEnergy * 4

          for (let i = 0; i < PARTICLES_PER_FIREWORK; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)]
            
            const hue = (baseHue + (Math.random() - 0.5) * 0.2) % 1
            const color = new THREE.Color().setHSL(hue, 0.95, 0.6)

            const material = new THREE.MeshStandardMaterial({
              color,
              emissive: color,
              emissiveIntensity: 1.5,
              metalness: 0.2,
              roughness: 0.4,
              transparent: true,
              opacity: 1,
            })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.copy(firework.center)

            // Spherical explosion pattern
            const phi = Math.random() * Math.PI * 2
            const theta = Math.random() * Math.PI
            const speed = 0.8 + Math.random() * 1.2

            const velocity = new THREE.Vector3(
              Math.sin(theta) * Math.cos(phi) * speed * explosionStrength,
              Math.sin(theta) * Math.sin(phi) * speed * explosionStrength,
              Math.cos(theta) * speed * explosionStrength,
            )

            const acceleration = new THREE.Vector3(0, -0.03, 0) // Gravity

            scene.add(mesh)

            // Create trail
            const trailPoints = [mesh.position.clone()]
            const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints)
            const trailMaterial = new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity: 0.8,
              linewidth: 2,
            })
            const trail = new THREE.Line(trailGeometry, trailMaterial)
            scene.add(trail)

            // Create sparkle effect
            const sparkles: THREE.Points[] = []
            if (Math.random() > 0.7) {
              const sparkleGeo = new THREE.BufferGeometry()
              const sparklePositions = new Float32Array(15 * 3)
              for (let s = 0; s < 15; s++) {
                sparklePositions[s * 3] = (Math.random() - 0.5) * 2
                sparklePositions[s * 3 + 1] = (Math.random() - 0.5) * 2
                sparklePositions[s * 3 + 2] = (Math.random() - 0.5) * 2
              }
              sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3))
              const sparkleMat = new THREE.PointsMaterial({
                color,
                size: 0.4,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending,
              })
              const sparklePoints = new THREE.Points(sparkleGeo, sparkleMat)
              scene.add(sparklePoints)
              sparkles.push(sparklePoints)
            }

            firework.particles.push({
              mesh,
              velocity,
              acceleration,
              life: 0,
              maxLife: 3 + Math.random() * 2,
              color,
              rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
              ),
              trail,
              trailPoints,
              sparkles,
            })
          }

          fireworks.push(firework)
        }
      }

      // Update fireworks
      const activeFireworks = fireworks.filter((firework) => {
        firework.life += 0.016

        const activeParticles = firework.particles.filter((particle) => {
          particle.life += 0.016
          const lifeRatio = particle.life / particle.maxLife

          if (lifeRatio >= 1) {
            scene.remove(particle.mesh)
            particle.mesh.geometry.dispose()
            ;(particle.mesh.material as THREE.Material).dispose()
            scene.remove(particle.trail)
            particle.trail.geometry.dispose()
            ;(particle.trail.material as THREE.Material).dispose()
            particle.sparkles.forEach(s => {
              scene.remove(s)
              s.geometry.dispose()
              ;(s.material as THREE.Material).dispose()
            })
            return false
          }

          // Physics
          particle.velocity.add(particle.acceleration)
          particle.velocity.multiplyScalar(0.99) // Air resistance
          particle.mesh.position.add(particle.velocity)

          // Rotation
          particle.mesh.rotation.x += particle.rotationSpeed.x
          particle.mesh.rotation.y += particle.rotationSpeed.y
          particle.mesh.rotation.z += particle.rotationSpeed.z

          // Scale and fade
          const scale = Math.max(0.1, 1 - lifeRatio * 0.6)
          particle.mesh.scale.set(scale, scale, scale)

          const material = particle.mesh.material as THREE.MeshStandardMaterial
          material.opacity = Math.max(0, 1 - Math.pow(lifeRatio, 0.7))
          material.emissiveIntensity = (1 - lifeRatio) * (1.5 + highEnergy)

          // Update trail
          particle.trailPoints.push(particle.mesh.position.clone())
          if (particle.trailPoints.length > 20) {
            particle.trailPoints.shift()
          }
          particle.trail.geometry.setFromPoints(particle.trailPoints)
          const trailMat = particle.trail.material as THREE.LineBasicMaterial
          trailMat.opacity = material.opacity * 0.6

          // Update sparkles
          particle.sparkles.forEach(sparkle => {
            sparkle.position.copy(particle.mesh.position)
            const sparkleMat = sparkle.material as THREE.PointsMaterial
            sparkleMat.opacity = material.opacity * 0.8
            sparkleMat.size = 0.4 * scale
          })

          return true
        })

        firework.particles = activeParticles
        return activeParticles.length > 0
      })

      fireworksMap.set(canvasRef.current!, activeFireworks)

      // Dynamic camera
      camera.position.x = Math.sin(timeRef.current * 0.15) * (15 + midEnergy * 12)
      camera.position.y = Math.cos(timeRef.current * 0.12) * (10 + midEnergy * 8)
      camera.rotation.z = Math.sin(timeRef.current * 0.08) * 0.03
      camera.lookAt(0, 0, 0)

      // Dynamic lighting
      lights.forEach((light, i) => {
        light.intensity = 3 + bassEnergy * 5
        const angle = timeRef.current * 0.5 + i * (Math.PI * 2 / 3)
        light.position.x = Math.cos(angle) * 50
        light.position.y = Math.sin(angle) * 40
        light.position.z = 30
        const lightHue = (timeRef.current * 0.1 + i * 0.33) % 1
        light.color.setHSL(lightHue, 1, 0.6)
      })

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
      if (canvasRef.current && fireworksMap.has(canvasRef.current)) {
        const fireworks = fireworksMap.get(canvasRef.current)!
        fireworks.forEach(firework => {
          firework.particles.forEach((particle) => {
            scene.remove(particle.mesh)
            particle.mesh.geometry.dispose()
            ;(particle.mesh.material as THREE.Material).dispose()
            scene.remove(particle.trail)
            particle.trail.geometry.dispose()
            ;(particle.trail.material as THREE.Material).dispose()
            particle.sparkles.forEach(s => {
              scene.remove(s)
              s.geometry.dispose()
              ;(s.material as THREE.Material).dispose()
            })
          })
        })
        fireworksMap.delete(canvasRef.current)
      }

      geometries.forEach(geo => geo.dispose())
      renderer.dispose()
    }
  }, [sensitivity])

  return (
    <canvas
      ref={canvasRef}
      className="block h-full min-h-[420px] w-full rounded-3xl bg-black"
    />
  )
}

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'
import { getMobileOptimizedSettings } from '../../utils/mobile'

// PROFESSIONAL Particle Explosion - Multi-directional, beat-synced, realistic depth
const PARTICLE_COUNT_PER_EXPLOSION = 200
const MAX_EXPLOSIONS = 8
const GRAVITY = -0.015
const DRAG = 0.98
const TRAIL_LENGTH = 12

// Explosion patterns
const EXPLOSION_PATTERNS = {
  SPHERE: 'sphere',
  CONE: 'cone',
  RING: 'ring',
  FOUNTAIN: 'fountain',
  BURST: 'burst',
}

interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
  initialColor: THREE.Color
  rotationAxis: THREE.Vector3
  rotationSpeed: number
  size: number
  trail?: THREE.Line
  trailPoints: THREE.Vector3[]
}

interface Explosion {
  particles: Particle[]
  origin: THREE.Vector3
  pattern: string
  hue: number
  age: number
  shockwave?: THREE.Mesh
}

export function ParticleExplosion({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const explosionsRef = useRef<Explosion[]>([])
  const timeRef = useRef(0)
  const lastBeatTimeRef = useRef(0)

  const mobileSettings = getMobileOptimizedSettings()
  const effectiveParticleCount = Math.floor(PARTICLE_COUNT_PER_EXPLOSION * mobileSettings.particleReduction)

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(0x000000, 30, 150)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera
    camera.position.set(0, 10, 50)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: mobileSettings.quality !== 'low',
      alpha: false,
    })
    rendererRef.current = renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * mobileSettings.resolutionScale)

    // Lighting for depth
    const ambientLight = new THREE.AmbientLight(0x202030, 0.3)
    scene.add(ambientLight)

    const lights: THREE.PointLight[] = []
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(0xffffff, 2, 100)
      light.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      )
      lights.push(light)
      scene.add(light)
    }

    // Post-processing for glow
    if (mobileSettings.enableGlow) {
      const composer = new EffectComposer(renderer)
      composerRef.current = composer
      composer.addPass(new RenderPass(scene, camera))
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        0.85
      )
      composer.addPass(bloomPass)
    }

    const handleResize = () => {
      if (!canvasRef.current || !camera || !renderer) return
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
      if (composerRef.current) {
        composerRef.current.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      explosionsRef.current.forEach(exp => {
        exp.particles.forEach(p => {
          scene.remove(p.mesh)
          p.mesh.geometry.dispose()
          if (!Array.isArray(p.mesh.material)) p.mesh.material.dispose()
          if (p.trail) {
            scene.remove(p.trail)
            p.trail.geometry.dispose()
            if (!Array.isArray(p.trail.material)) p.trail.material.dispose()
          }
        })
        if (exp.shockwave) {
          scene.remove(exp.shockwave)
          exp.shockwave.geometry.dispose()
          if (!Array.isArray(exp.shockwave.material)) exp.shockwave.material.dispose()
        }
      })
      lights.forEach(l => scene.remove(l))
      scene.clear()
    }
  }, [sensitivity, theme, mobileSettings.quality, mobileSettings.resolutionScale, mobileSettings.particleReduction, mobileSettings.enableGlow])

  function createExplosion(
    origin: THREE.Vector3,
    pattern: string,
    strength: number,
    hue: number,
    scene: THREE.Scene
  ) {
    const explosion: Explosion = {
      particles: [],
      origin,
      pattern,
      hue,
      age: 0,
    }

    // Create shockwave ring
    const shockwaveGeometry = new THREE.RingGeometry(0.5, 1, 32)
    const shockwaveMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue, 1, 0.6),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    })
    const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial)
    shockwave.position.copy(origin)
    
    // Orient shockwave based on pattern
    if (pattern === EXPLOSION_PATTERNS.FOUNTAIN || pattern === EXPLOSION_PATTERNS.CONE) {
      shockwave.rotation.x = Math.PI / 2
    } else {
      shockwave.rotation.x = Math.random() * Math.PI
      shockwave.rotation.y = Math.random() * Math.PI
    }
    
    scene.add(shockwave)
    explosion.shockwave = shockwave

    // Particle geometries for variety and depth
    const geometries = [
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.TetrahedronGeometry(0.4, 0),
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
    ]

    for (let i = 0; i < effectiveParticleCount; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)]
      const size = 0.8 + Math.random() * 0.4
      
      const particleHue = (hue + (Math.random() - 0.5) * 0.15) % 1
      const color = new THREE.Color().setHSL(particleHue, 0.9 + Math.random() * 0.1, 0.5 + Math.random() * 0.2)

      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.2 + Math.random() * 0.8,
        metalness: 0.4 + Math.random() * 0.3,
        roughness: 0.3 + Math.random() * 0.3,
        transparent: true,
        opacity: 1,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(origin)
      mesh.scale.setScalar(size)
      scene.add(mesh)

      // Velocity based on explosion pattern
      let velocity: THREE.Vector3
      const speed = (0.5 + Math.random() * 1.0) * strength

      switch (pattern) {
        case EXPLOSION_PATTERNS.SPHERE:
          // Spherical explosion in all directions
          const phi = Math.random() * Math.PI * 2
          const theta = Math.random() * Math.PI
          velocity = new THREE.Vector3(
            Math.sin(theta) * Math.cos(phi) * speed,
            Math.sin(theta) * Math.sin(phi) * speed,
            Math.cos(theta) * speed
          )
          break

        case EXPLOSION_PATTERNS.CONE:
          // Upward cone explosion
          const coneAngle = Math.random() * Math.PI * 0.5
          const coneRotation = Math.random() * Math.PI * 2
          velocity = new THREE.Vector3(
            Math.sin(coneAngle) * Math.cos(coneRotation) * speed,
            Math.cos(coneAngle) * speed * 1.5,
            Math.sin(coneAngle) * Math.sin(coneRotation) * speed
          )
          break

        case EXPLOSION_PATTERNS.RING:
          // Horizontal ring explosion
          const ringAngle = Math.random() * Math.PI * 2
          velocity = new THREE.Vector3(
            Math.cos(ringAngle) * speed,
            (Math.random() - 0.5) * speed * 0.3,
            Math.sin(ringAngle) * speed
          )
          break

        case EXPLOSION_PATTERNS.FOUNTAIN:
          // Fountain-like upward spray
          const fountainSpread = (Math.random() - 0.5) * 0.5
          velocity = new THREE.Vector3(
            fountainSpread * speed,
            (0.8 + Math.random() * 0.4) * speed * 2,
            fountainSpread * speed
          )
          break

        case EXPLOSION_PATTERNS.BURST:
          // Directional burst
          const burstDir = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize()
          velocity = burstDir.multiplyScalar(speed * (1 + Math.random()))
          break

        default:
          velocity = new THREE.Vector3(0, speed, 0)
      }

      // Add randomness for realism
      velocity.x += (Math.random() - 0.5) * 0.2
      velocity.y += (Math.random() - 0.5) * 0.2
      velocity.z += (Math.random() - 0.5) * 0.2

      // Trail setup
      const trailMaterial = new THREE.LineBasicMaterial({
        color: color.clone(),
        transparent: true,
        opacity: 0.6,
        linewidth: 2,
      })
      const trailGeometry = new THREE.BufferGeometry().setFromPoints([mesh.position.clone()])
      const trail = mobileSettings.enableTrails ? new THREE.Line(trailGeometry, trailMaterial) : undefined
      if (trail) scene.add(trail)

      explosion.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 2 + Math.random() * 1.5,
        initialColor: color.clone(),
        rotationAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        size,
        trail,
        trailPoints: [mesh.position.clone()],
      })
    }

    explosionsRef.current.push(explosion)
  }

  useCanvasLoop(
    canvasRef,
    (_ctx, dims, frame) => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

      const { width, height } = dims
      timeRef.current += 0.016

      if (rendererRef.current.domElement.width !== width || rendererRef.current.domElement.height !== height) {
        rendererRef.current.setSize(width, height)
        if (composerRef.current) {
          composerRef.current.setSize(width, height)
        }
        if (cameraRef.current) {
          cameraRef.current.aspect = width / height
          cameraRef.current.updateProjectionMatrix()
        }
      }

      const bassEnergy = easeAudio(frame.bassEnergy, EASING_CURVES.BASS) * sensitivity
      const midEnergy = easeAudio(frame.midEnergy, EASING_CURVES.MID) * sensitivity
      const highEnergy = easeAudio(frame.highEnergy, EASING_CURVES.HIGH) * sensitivity

      // BEAT-TRIGGERED EXPLOSIONS with varied patterns and positions
      if (frame.beatInfo?.isBeat && frame.beatInfo.confidence > 0.5 && timeRef.current - lastBeatTimeRef.current > 0.2) {
        lastBeatTimeRef.current = timeRef.current

        if (explosionsRef.current.length < MAX_EXPLOSIONS) {
          // Choose pattern based on energy levels
          let pattern: string
          if (bassEnergy > 0.7) {
            pattern = EXPLOSION_PATTERNS.SPHERE
          } else if (midEnergy > 0.7) {
            pattern = EXPLOSION_PATTERNS.CONE
          } else if (highEnergy > 0.7) {
            pattern = EXPLOSION_PATTERNS.BURST
          } else if (Math.random() > 0.5) {
            pattern = EXPLOSION_PATTERNS.FOUNTAIN
          } else {
            pattern = EXPLOSION_PATTERNS.RING
          }

          // Varied origin positions for different angles
          const origin = new THREE.Vector3(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.3) * 25,
            (Math.random() - 0.5) * 20
          )

          const strength = 1.5 + bassEnergy * 2.5
          const hue = Math.random()

          createExplosion(origin, pattern, strength, hue, sceneRef.current!)
        }
      }

      // Update explosions
      const activeExplosions: Explosion[] = []
      explosionsRef.current.forEach(explosion => {
        explosion.age += 0.016

        // Update shockwave
        if (explosion.shockwave) {
          const scale = 1 + explosion.age * 20
          explosion.shockwave.scale.setScalar(scale)
          const material = explosion.shockwave.material as THREE.MeshBasicMaterial
          material.opacity = Math.max(0, 0.8 - explosion.age * 2)

          if (material.opacity <= 0) {
            sceneRef.current!.remove(explosion.shockwave)
            explosion.shockwave.geometry.dispose()
            material.dispose()
            explosion.shockwave = undefined
          }
        }

        // Update particles
        const activeParticles: Particle[] = []
        explosion.particles.forEach(particle => {
          particle.life += 0.016
          const lifeRatio = particle.life / particle.maxLife

          if (lifeRatio < 1) {
            // Apply physics
            particle.velocity.y += GRAVITY * (1 + bassEnergy * 0.5)
            particle.velocity.multiplyScalar(DRAG)
            particle.mesh.position.add(particle.velocity)

            // Rotation for depth perception
            particle.mesh.rotateOnAxis(particle.rotationAxis, particle.rotationSpeed * (1 + highEnergy * 0.5))

            // Scale fade
            const scale = particle.size * Math.max(0, 1 - lifeRatio)
            particle.mesh.scale.setScalar(scale)

            // Opacity fade
            const material = particle.mesh.material as THREE.MeshStandardMaterial
            material.opacity = Math.max(0, 1 - lifeRatio)
            material.emissiveIntensity = (1.2 + midEnergy * 0.8) * (1 - lifeRatio * 0.5)

            // Update trail
            if (particle.trail) {
              particle.trailPoints.push(particle.mesh.position.clone())
              if (particle.trailPoints.length > TRAIL_LENGTH) {
                particle.trailPoints.shift()
              }
              const trailGeometry = new THREE.BufferGeometry().setFromPoints(particle.trailPoints)
              particle.trail.geometry.dispose()
              particle.trail.geometry = trailGeometry
              const trailMat = particle.trail.material as THREE.LineBasicMaterial
              trailMat.opacity = 0.6 * (1 - lifeRatio)
            }

            activeParticles.push(particle)
          } else {
            // Cleanup
            sceneRef.current!.remove(particle.mesh)
            particle.mesh.geometry.dispose()
            if (!Array.isArray(particle.mesh.material)) particle.mesh.material.dispose()
            if (particle.trail) {
              sceneRef.current!.remove(particle.trail)
              particle.trail.geometry.dispose()
              if (!Array.isArray(particle.trail.material)) particle.trail.material.dispose()
            }
          }
        })

        explosion.particles = activeParticles
        if (activeParticles.length > 0 || explosion.shockwave) {
          activeExplosions.push(explosion)
        }
      })
      explosionsRef.current = activeExplosions

      // Camera movement
      cameraRef.current.position.x = Math.sin(timeRef.current * 0.08) * 25
      cameraRef.current.position.y = 10 + Math.cos(timeRef.current * 0.06) * 15
      cameraRef.current.lookAt(0, 0, 0)

      // Dynamic lighting
      const lights = sceneRef.current.children.filter(c => c instanceof THREE.PointLight) as THREE.PointLight[]
      lights.forEach((light, i) => {
        light.intensity = 2 + (i === 0 ? bassEnergy : i === 1 ? midEnergy : highEnergy) * 3
        light.color.setHSL((timeRef.current * 0.1 + i * 0.25) % 1, 1, 0.7)
      })

      // Render
      if (composerRef.current) {
        composerRef.current.render()
      } else {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    },
    [sensitivity, theme],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { VisualComponentProps } from '../types'
import { audioEngine } from '../../audio/AudioEngine'

// ULTRA-UNIQUE: Morphing Fractal Geometry Engine - Nothing like this exists
const FRACTAL_LEVELS = 4
const BASE_SHAPES = 8

export function GeometricPulse({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
    renderer.setClearColor(0x000000, 1.0)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000510, 25, 80)
    
    const camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.set(0, 8, 25)
    camera.lookAt(0, 0, 0)

    // Dramatic multi-color lighting
    const ambient = new THREE.AmbientLight(0x1a1a2e, 0.4)
    scene.add(ambient)
    
    const lights: THREE.PointLight[] = []
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight(0xffffff, 2, 60)
      lights.push(light)
      scene.add(light)
    }

    // Create fractal structure
    interface FractalShape {
      mesh: THREE.Mesh
      level: number
      parentPos: THREE.Vector3
      orbitAngle: number
      orbitSpeed: number
      orbitRadius: number
      pulsePhase: number
      morphTarget: number
      currentGeometry: number
    }

    const shapes: FractalShape[] = []
    
    // Geometry types for morphing
    const createGeometry = (type: number, size: number) => {
      switch (type) {
        case 0: return new THREE.OctahedronGeometry(size, 0)
        case 1: return new THREE.TetrahedronGeometry(size, 0)
        case 2: return new THREE.IcosahedronGeometry(size, 0)
        case 3: return new THREE.DodecahedronGeometry(size, 0)
        case 4: return new THREE.BoxGeometry(size * 1.3, size * 1.3, size * 1.3)
        case 5: return new THREE.ConeGeometry(size * 0.9, size * 2, 5)
        case 6: return new THREE.TorusGeometry(size * 0.8, size * 0.3, 8, 12)
        default: return new THREE.SphereGeometry(size, 12, 12)
      }
    }

    // Build recursive fractal
    const buildFractal = (parent: THREE.Vector3, level: number, baseAngle: number, radius: number) => {
      if (level > FRACTAL_LEVELS) return

      const angleStep = (Math.PI * 2) / BASE_SHAPES
      const size = 1.2 / (level * 0.5 + 1)

      for (let i = 0; i < BASE_SHAPES; i++) {
        const angle = baseAngle + i * angleStep
        const geoType = (level + i) % 7
        const geometry = createGeometry(geoType, size)

        const color = new THREE.Color().setHSL((level * 0.15 + i * 0.08) % 1, 0.9, 0.6)
        const material = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.15,
          transparent: true,
          opacity: 1 - level * 0.15,
          wireframe: level % 2 === 1, // Alternate wireframe
        })

        const mesh = new THREE.Mesh(geometry, material)
        
        const x = parent.x + Math.cos(angle) * radius
        const z = parent.z + Math.sin(angle) * radius
        const y = parent.y + (level - FRACTAL_LEVELS / 2) * 1.5
        mesh.position.set(x, y, z)

        scene.add(mesh)

        shapes.push({
          mesh,
          level,
          parentPos: parent.clone(),
          orbitAngle: angle,
          orbitSpeed: 0.005 + level * 0.003,
          orbitRadius: radius,
          pulsePhase: Math.random() * Math.PI * 2,
          morphTarget: (geoType + 1) % 7,
          currentGeometry: geoType,
        })

        // Recursive build
        if (level < FRACTAL_LEVELS) {
          buildFractal(new THREE.Vector3(x, y, z), level + 1, angle + Math.PI / 4, radius * 0.4)
        }
      }
    }

    // Build initial fractal
    buildFractal(new THREE.Vector3(0, 0, 0), 1, 0, 8)

    // Central core - massive pulsing sphere
    const coreGeometry = new THREE.IcosahedronGeometry(2, 2)
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.5,
      metalness: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.8,
    })
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial)
    scene.add(coreMesh)

    // Energy beams connecting shapes
    const beamLines: THREE.Line[] = []
    for (let i = 0; i < shapes.length; i += 3) {
      if (i + 1 < shapes.length) {
        const points = [shapes[i].mesh.position, shapes[i + 1].mesh.position]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.4,
          linewidth: 2,
        })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        beamLines.push(line)
      }
    }

    // Particle field
    const particleCount = 500
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 50
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 50
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50
      
      const hue = Math.random()
      const color = new THREE.Color().setHSL(hue, 1, 0.7)
      particleColors[i * 3] = color.r
      particleColors[i * 3 + 1] = color.g
      particleColors[i * 3 + 2] = color.b
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
    })
    
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particleSystem)

    const resize = () => {
      if (!canvas) return
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const handleResize = () => resize()
    window.addEventListener('resize', handleResize)
    resize()

    let time = 0
    let frame: number
    let morphTimer = 0
    
    const animate = () => {
      const data = audioEngine.getFrame()
      time += 0.016
      morphTimer += 0.016
      
      const bassEnergy = Math.pow(data.bassEnergy, 0.7) * sensitivity
      const midEnergy = Math.pow(data.midEnergy, 0.85) * sensitivity
      const highEnergy = Math.pow(data.highEnergy, 0.95) * sensitivity

      // Morphing fractals
      shapes.forEach((shape, idx) => {
        // Sample frequency based on level and position
        const freqIndex = Math.floor((shape.level / FRACTAL_LEVELS + idx / shapes.length * 0.5) * data.frequencyData.length * 0.85)
        const sample = data.frequencyData[freqIndex] / 255

        // Geometry morphing every 10 seconds
        if (morphTimer > 10) {
          shape.currentGeometry = shape.morphTarget
          shape.morphTarget = (shape.morphTarget + 1) % 7
          
          const newSize = 1.2 / (shape.level * 0.5 + 1)
          const newGeometry = createGeometry(shape.currentGeometry, newSize)
          shape.mesh.geometry.dispose()
          shape.mesh.geometry = newGeometry
        }

        // Orbital motion
        shape.orbitAngle += shape.orbitSpeed * (1 + midEnergy * 3)
        const orbitRadius = shape.orbitRadius * (1 + bassEnergy * 0.5)
        shape.mesh.position.x = shape.parentPos.x + Math.cos(shape.orbitAngle) * orbitRadius
        shape.mesh.position.z = shape.parentPos.z + Math.sin(shape.orbitAngle) * orbitRadius

        // Pulsing and floating
        const pulse = Math.sin(time * 2 + shape.pulsePhase) * 0.5 + 1
        const audioPulse = 1 + sample * 2 * sensitivity
        const finalScale = pulse * audioPulse
        shape.mesh.scale.set(finalScale, finalScale, finalScale)
        shape.mesh.position.y = shape.parentPos.y + (shape.level - FRACTAL_LEVELS / 2) * 1.5 + Math.sin(time + shape.pulsePhase) * 1.5

        // Rotation
        shape.mesh.rotation.x += 0.01 * (1 + sample)
        shape.mesh.rotation.y += 0.015 * (1 + sample)
        shape.mesh.rotation.z += 0.008 * (1 + sample)

        // Dynamic coloring
        const material = shape.mesh.material as THREE.MeshStandardMaterial
        const hue = ((shape.level * 0.15 + idx * 0.08 + time * 0.05) % 1)
        material.color.setHSL(hue, 0.9, 0.5 + sample * 0.4)
        material.emissive.setHSL(hue, 1.0, 0.3 + sample * 0.5)
        material.emissiveIntensity = 0.6 + sample * 2
        material.opacity = (1 - shape.level * 0.15) * (0.7 + sample * 0.3)
      })

      if (morphTimer > 10) morphTimer = 0

      // Update beams
      beamLines.forEach((line, idx) => {
        if (idx * 3 + 1 < shapes.length) {
          const points = [shapes[idx * 3].mesh.position, shapes[idx * 3 + 1].mesh.position]
          line.geometry.setFromPoints(points)
          const material = line.material as THREE.LineBasicMaterial
          material.opacity = 0.3 + midEnergy * 0.6
          const beamHue = (time * 0.1 + idx * 0.2) % 1
          material.color.setHSL(beamHue, 1, 0.6)
        }
      })

      // Animate core
      coreMesh.rotation.x += 0.015
      coreMesh.rotation.y += 0.02
      const coreScale = 1 + bassEnergy * 2
      coreMesh.scale.set(coreScale, coreScale, coreScale)
      coreMaterial.emissiveIntensity = 1.5 + data.overallVolume * 3
      const coreHue = (time * 0.12) % 1
      coreMaterial.color.setHSL(coreHue, 1, 0.7)
      coreMaterial.emissive.setHSL(coreHue, 1, 0.7)

      // Animate particles
      const positions = particleGeometry.attributes.position.array as Float32Array
      const colors = particleGeometry.attributes.color.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        // Orbit around center
        const angle = Math.atan2(positions[i3 + 2], positions[i3])
        const radius = Math.sqrt(positions[i3] * positions[i3] + positions[i3 + 2] * positions[i3 + 2])
        
        positions[i3] = Math.cos(angle + 0.005 + highEnergy * 0.01) * radius
        positions[i3 + 2] = Math.sin(angle + 0.005 + highEnergy * 0.01) * radius
        positions[i3 + 1] += (Math.random() - 0.5) * 0.2

        // Wrap vertically
        if (positions[i3 + 1] > 25) positions[i3 + 1] = -25
        if (positions[i3 + 1] < -25) positions[i3 + 1] = 25

        // Update colors
        const colorHue = (time * 0.08 + (i / particleCount) * 0.8) % 1
        const color = new THREE.Color().setHSL(colorHue, 1, 0.6 + highEnergy * 0.3)
        colors[i3] = color.r
        colors[i3 + 1] = color.g
        colors[i3 + 2] = color.b
      }
      
      particleGeometry.attributes.position.needsUpdate = true
      particleGeometry.attributes.color.needsUpdate = true

      // Dynamic lighting
      lights.forEach((light, i) => {
        light.intensity = 2 + (i === 0 ? bassEnergy : i === 1 ? midEnergy : highEnergy) * 5
        const angle = time * (0.3 + i * 0.2) + i * (Math.PI * 2 / 5)
        light.position.x = Math.cos(angle) * 25
        light.position.y = Math.sin(angle) * 20 + 10
        light.position.z = Math.cos(angle + Math.PI / 2) * 25
        light.color.setHSL((time * 0.08 + i * 0.2) % 1, 1, 0.6)
      })

      // Dynamic camera
      camera.position.x = Math.sin(time * 0.15) * 3
      camera.position.y = 8 + Math.cos(time * 0.12) * 2 + bassEnergy * 5
      camera.position.z = 25 + Math.sin(time * 0.08) * 4
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      shapes.forEach((shape) => {
        shape.mesh.geometry.dispose()
        if (Array.isArray(shape.mesh.material)) {
          shape.mesh.material.forEach(m => m.dispose())
        } else {
          shape.mesh.material.dispose()
        }
      })
      beamLines.forEach((line) => {
        line.geometry.dispose()
        if (Array.isArray(line.material)) {
          line.material.forEach(m => m.dispose())
        } else {
          line.material.dispose()
        }
      })
      coreGeometry.dispose()
      coreMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
    }
  }, [sensitivity, theme])

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black" />
}

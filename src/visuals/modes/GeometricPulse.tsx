import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { VisualComponentProps } from '../types'
import { audioEngine } from '../../audio/AudioEngine'

// Morphing 3D Crystal Lattice - Original geometric visualization
const CRYSTAL_LAYERS = 6
const CRYSTALS_PER_LAYER = 10

export function GeometricPulse({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
    renderer.setClearColor(0x000000, 0.0)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000510, 20, 70)
    
    const camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.set(0, 6, 22)
    camera.lookAt(0, 0, 0)

    // Dynamic lighting
    const ambient = new THREE.AmbientLight(0x202040, 0.8)
    scene.add(ambient)
    
    const light1 = new THREE.PointLight(0x00ffff, 2, 50)
    light1.position.set(10, 15, 10)
    scene.add(light1)
    
    const light2 = new THREE.PointLight(0xff00ff, 2, 50)
    light2.position.set(-10, 15, -10)
    scene.add(light2)
    
    const light3 = new THREE.PointLight(0xffff00, 1.5, 40)
    light3.position.set(0, 20, 0)
    scene.add(light3)

    // Create crystal structures
    interface Crystal {
      mesh: THREE.Mesh
      originalScale: number
      angle: number
      radius: number
      layer: number
      rotationSpeed: THREE.Vector3
      pulsePhase: number
      geometryType: number // 0-5 for different geometries
    }

    const crystals: Crystal[] = []
    const geometryTypes = [
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.ConeGeometry(0.8, 1.8, 6),
    ]

    for (let layer = 0; layer < CRYSTAL_LAYERS; layer++) {
      const layerRadius = 4 + layer * 2
      const verticalPos = (layer - CRYSTAL_LAYERS / 2) * 2

      for (let i = 0; i < CRYSTALS_PER_LAYER; i++) {
        const angle = (i / CRYSTALS_PER_LAYER) * Math.PI * 2
        const geometryType = Math.floor(Math.random() * geometryTypes.length)
        const geometry = geometryTypes[geometryType].clone()

        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL((layer * 0.15 + i * 0.05) % 1, 0.85, 0.6),
          emissive: new THREE.Color().setHSL((layer * 0.15 + i * 0.05) % 1, 1.0, 0.3),
          emissiveIntensity: 0.5,
          metalness: 0.7,
          roughness: 0.2,
          transparent: true,
          opacity: 0.85,
          wireframe: Math.random() > 0.7, // Some crystals are wireframe
        })

        const mesh = new THREE.Mesh(geometry, material)
        
        const x = Math.cos(angle) * layerRadius
        const z = Math.sin(angle) * layerRadius
        mesh.position.set(x, verticalPos, z)
        
        const scale = 0.6 + Math.random() * 0.6
        mesh.scale.set(scale, scale, scale)

        scene.add(mesh)

        crystals.push({
          mesh,
          originalScale: scale,
          angle,
          radius: layerRadius,
          layer,
          rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
          ),
          pulsePhase: Math.random() * Math.PI * 2,
          geometryType,
        })
      }
    }

    // Create connecting beams between crystals
    const beams: THREE.Line[] = []
    crystals.forEach((crystal, idx) => {
      if (idx % 3 === 0 && idx + 1 < crystals.length) {
        const target = crystals[idx + 1]
        const points = [
          crystal.mesh.position,
          target.mesh.position,
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.3,
          linewidth: 2,
        })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        beams.push(line)
      }
    })

    // Central core sphere
    const coreGeometry = new THREE.IcosahedronGeometry(1.5, 1)
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1,
      metalness: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
    })
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial)
    scene.add(coreMesh)

    // Energy particles orbiting the structure
    const particleCount = 200
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 18
      const height = (Math.random() - 0.5) * 12
      
      particlePositions[i * 3] = Math.cos(angle) * radius
      particlePositions[i * 3 + 1] = height
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius
      
      const hue = Math.random()
      const color = new THREE.Color().setHSL(hue, 1, 0.6)
      particleColors[i * 3] = color.r
      particleColors[i * 3 + 1] = color.g
      particleColors[i * 3 + 2] = color.b
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.2,
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
    
    const animate = () => {
      const data = audioEngine.getFrame()
      time += 0.016
      
      // Animate crystals
      crystals.forEach((crystal, idx) => {
        // Sample frequency based on layer and position
        const freqIndex = Math.floor((crystal.layer / CRYSTAL_LAYERS + idx / crystals.length * 0.5) * data.frequencyData.length * 0.85)
        const sample = data.frequencyData[freqIndex] / 255
        
        // Pulse scale based on audio
        const pulse = Math.sin(time * 2 + crystal.pulsePhase + sample * Math.PI * 2) * 0.2 + 1
        const audioPulse = 1 + sample * 1.5 * sensitivity
        const finalScale = crystal.originalScale * pulse * audioPulse
        crystal.mesh.scale.set(finalScale, finalScale, finalScale)
        
        // Rotation
        crystal.mesh.rotation.x += crystal.rotationSpeed.x * (1 + sample * 2)
        crystal.mesh.rotation.y += crystal.rotationSpeed.y * (1 + sample * 2)
        crystal.mesh.rotation.z += crystal.rotationSpeed.z * (1 + sample * 2)
        
        // Orbital movement
        crystal.angle += 0.005 + data.midEnergy * 0.015
        const orbitRadius = crystal.radius * (1 + data.bassEnergy * 0.3 * sensitivity)
        crystal.mesh.position.x = Math.cos(crystal.angle) * orbitRadius
        crystal.mesh.position.z = Math.sin(crystal.angle) * orbitRadius
        
        // Vertical oscillation
        const verticalBase = (crystal.layer - CRYSTAL_LAYERS / 2) * 2
        crystal.mesh.position.y = verticalBase + Math.sin(time + crystal.pulsePhase) * 0.5 + data.highEnergy * 2 * sensitivity
        
        // Dynamic coloring
        const material = crystal.mesh.material as THREE.MeshStandardMaterial
        const hue = ((crystal.layer * 0.15 + idx * 0.05 + time * 0.05) % 1)
        material.color.setHSL(hue, 0.85, 0.5 + sample * 0.4)
        material.emissive.setHSL(hue, 1.0, 0.2 + sample * 0.5)
        material.emissiveIntensity = 0.5 + sample * 1.5
        material.opacity = 0.7 + sample * 0.3
      })

      // Update connecting beams
      beams.forEach((beam, idx) => {
        if (idx * 2 + 1 < crystals.length) {
          const crystal1 = crystals[idx * 2]
          const crystal2 = crystals[idx * 2 + 1]
          const points = [crystal1.mesh.position, crystal2.mesh.position]
          beam.geometry.setFromPoints(points)
          
          const material = beam.material as THREE.LineBasicMaterial
          material.opacity = 0.2 + data.midEnergy * 0.5
        }
      })

      // Animate core
      coreMesh.rotation.x += 0.01
      coreMesh.rotation.y += 0.015
      const coreScale = 1 + data.bassEnergy * 1.2 * sensitivity
      coreMesh.scale.set(coreScale, coreScale, coreScale)
      coreMaterial.emissiveIntensity = 0.8 + data.overallVolume * 1.5
      const coreHue = (time * 0.1) % 1
      coreMaterial.color.setHSL(coreHue, 1, 0.6)
      coreMaterial.emissive.setHSL(coreHue, 1, 0.6)

      // Animate particles
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3
        const px = particlePositions[idx]
        const pz = particlePositions[idx + 2]
        const radius = Math.sqrt(px * px + pz * pz)
        const angle = Math.atan2(pz, px) + 0.01 + data.midEnergy * 0.02
        
        particlePositions[idx] = Math.cos(angle) * radius
        particlePositions[idx + 2] = Math.sin(angle) * radius
        particlePositions[idx + 1] += (Math.random() - 0.5) * 0.1 + data.highEnergy * 0.15
        
        // Wrap vertically
        if (particlePositions[idx + 1] > 8) particlePositions[idx + 1] = -8
        if (particlePositions[idx + 1] < -8) particlePositions[idx + 1] = 8
        
        // Update colors
        const colorHue = (time * 0.05 + (i / particleCount) * 0.7) % 1
        const color = new THREE.Color().setHSL(colorHue, 1, 0.6 + data.highEnergy * 0.3)
        particleColors[idx] = color.r
        particleColors[idx + 1] = color.g
        particleColors[idx + 2] = color.b
      }
      
      particleGeometry.attributes.position.needsUpdate = true
      particleGeometry.attributes.color.needsUpdate = true

      // Dynamic lighting
      light1.intensity = 2 + data.bassEnergy * 3
      light2.intensity = 2 + data.midEnergy * 3
      light3.intensity = 1.5 + data.highEnergy * 2.5
      
      light1.color.setHSL((time * 0.08) % 1, 1, 0.6)
      light2.color.setHSL((time * 0.08 + 0.33) % 1, 1, 0.6)
      light3.color.setHSL((time * 0.08 + 0.66) % 1, 1, 0.6)
      
      light1.position.x = Math.cos(time * 0.5) * 15
      light1.position.z = Math.sin(time * 0.5) * 15
      light2.position.x = Math.cos(time * 0.5 + Math.PI) * 15
      light2.position.z = Math.sin(time * 0.5 + Math.PI) * 15

      // Dynamic camera
      camera.position.y = 6 + Math.sin(time * 0.3) * 2 + data.bassEnergy * 3
      camera.position.z = 22 + Math.cos(time * 0.2) * 3
      camera.rotation.z = Math.sin(time * 0.1) * 0.05
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      coreGeometry.dispose()
      coreMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      geometryTypes.forEach(geo => geo.dispose())
      crystals.forEach((crystal) => {
        crystal.mesh.geometry.dispose()
        if (Array.isArray(crystal.mesh.material)) {
          crystal.mesh.material.forEach(m => m.dispose())
        } else {
          crystal.mesh.material.dispose()
        }
      })
      beams.forEach((beam) => {
        beam.geometry.dispose()
        if (Array.isArray(beam.material)) {
          beam.material.forEach(m => m.dispose())
        } else {
          beam.material.dispose()
        }
      })
    }
  }, [sensitivity, theme])

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { VisualComponentProps } from '../types'
import { audioEngine } from '../../audio/AudioEngine'

// Natural flowing wave field with organic depth
const GRID_SIZE = 50
const WAVE_PARTICLES = 400

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
    scene.fog = new THREE.Fog(0x000510, 10, 50)
    
    const camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.set(0, 8, 12)
    camera.lookAt(0, 0, 0)

    // Soft ambient lighting
    const ambient = new THREE.AmbientLight(0x304060, 0.5)
    scene.add(ambient)
    
    // Directional lights for depth
    const light1 = new THREE.DirectionalLight(0x60a0ff, 1.2)
    light1.position.set(10, 15, 5)
    scene.add(light1)
    
    const light2 = new THREE.DirectionalLight(0xff60a0, 1.0)
    light2.position.set(-10, 12, -5)
    scene.add(light2)
    
    const light3 = new THREE.PointLight(0xffa060, 1.5, 40)
    light3.position.set(0, 10, 0)
    scene.add(light3)

    // Create flowing wave field
    const waveGeometry = new THREE.PlaneGeometry(30, 30, GRID_SIZE - 1, GRID_SIZE - 1)
    const waveMaterial = new THREE.MeshStandardMaterial({
      color: 0x2040a0,
      metalness: 0.4,
      roughness: 0.6,
      wireframe: false,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
    
    const waveMesh = new THREE.Mesh(waveGeometry, waveMaterial)
    waveMesh.rotation.x = -Math.PI / 2
    waveMesh.position.y = 0
    scene.add(waveMesh)

    const wavePositions = waveGeometry.attributes.position.array as Float32Array
    const waveCount = wavePositions.length / 3
    const originalY = new Float32Array(waveCount)
    for (let i = 0; i < waveCount; i++) {
      originalY[i] = wavePositions[i * 3 + 1]
    }

    // Particle system for flow visualization
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(WAVE_PARTICLES * 3)
    const particleVelocities = new Float32Array(WAVE_PARTICLES * 3)
    const particleColors = new Float32Array(WAVE_PARTICLES * 3)
    const particleSizes = new Float32Array(WAVE_PARTICLES)
    
    for (let i = 0; i < WAVE_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 12
      particlePositions[i * 3] = Math.cos(angle) * radius
      particlePositions[i * 3 + 1] = Math.random() * 10 - 2
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius
      
      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02
      particleVelocities[i * 3 + 1] = Math.random() * 0.01 + 0.01
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
      
      const hue = Math.random()
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6)
      particleColors[i * 3] = color.r
      particleColors[i * 3 + 1] = color.g
      particleColors[i * 3 + 2] = color.b
      
      particleSizes[i] = Math.random() * 0.15 + 0.05
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1))
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    })
    
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particleSystem)

    // Flowing energy ribbons
    const ribbonCount = 8
    const ribbons: THREE.Mesh[] = []
    
    for (let r = 0; r < ribbonCount; r++) {
      const ribbonGeometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-15, 0, 0),
          new THREE.Vector3(-8, 2, 0),
          new THREE.Vector3(0, 3, 0),
          new THREE.Vector3(8, 2, 0),
          new THREE.Vector3(15, 0, 0),
        ]),
        64,
        0.08,
        8,
        false
      )
      
      const ribbonMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(r / ribbonCount, 0.9, 0.6),
        emissive: new THREE.Color().setHSL(r / ribbonCount, 1.0, 0.3),
        emissiveIntensity: 0.8,
        metalness: 0.6,
        roughness: 0.3,
        transparent: true,
        opacity: 0.7,
      })
      
      const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial)
      const angle = (r / ribbonCount) * Math.PI * 2
      ribbon.position.x = Math.cos(angle) * 5
      ribbon.position.z = Math.sin(angle) * 5
      ribbon.position.y = 1
      ribbon.rotation.y = angle + Math.PI / 2
      ribbons.push(ribbon)
      scene.add(ribbon)
    }

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
      
      // Wave field animation
      for (let i = 0; i < waveCount; i++) {
        const x = wavePositions[i * 3]
        const z = wavePositions[i * 3 + 2]
        
        // Sample frequency based on position
        const distFromCenter = Math.sqrt(x * x + z * z)
        const normalizedDist = Math.min(distFromCenter / 15, 1)
        const freqIndex = Math.floor(normalizedDist * data.frequencyData.length * 0.8)
        const sample = data.frequencyData[freqIndex] / 255
        
        // Multi-wave interference
        const wave1 = Math.sin(distFromCenter * 0.4 - time * 1.5) * 0.5
        const wave2 = Math.cos(x * 0.3 + time * 1.2) * 0.3
        const wave3 = Math.sin(z * 0.3 - time * 1.0) * 0.3
        const ripple = Math.sin(distFromCenter * 0.6 - time * 2.0 + sample * Math.PI) * sample * 2
        
        wavePositions[i * 3 + 1] = originalY[i] + (wave1 + wave2 + wave3 + ripple) * sensitivity * 1.5
      }
      
      waveGeometry.attributes.position.needsUpdate = true
      waveGeometry.computeVertexNormals()
      
      // Dynamic wave coloring
      const waveHue = (time * 0.05 + data.midEnergy * 0.2) % 1
      waveMaterial.color.setHSL(waveHue, 0.7, 0.5)
      waveMaterial.emissive.setHSL(waveHue, 0.9, 0.2 + data.overallVolume * 0.3)
      waveMaterial.emissiveIntensity = 0.3 + data.bassEnergy * 0.7

      // Particle flow system
      for (let i = 0; i < WAVE_PARTICLES; i++) {
        const idx = i * 3
        
        // Update positions
        particlePositions[idx] += particleVelocities[idx] + (Math.random() - 0.5) * 0.01
        particlePositions[idx + 1] += particleVelocities[idx + 1] + data.highEnergy * 0.02
        particlePositions[idx + 2] += particleVelocities[idx + 2] + (Math.random() - 0.5) * 0.01
        
        // Spiral force towards center
        const px = particlePositions[idx]
        const pz = particlePositions[idx + 2]
        const dist = Math.sqrt(px * px + pz * pz)
        
        if (dist > 0.1) {
          const angle = Math.atan2(pz, px) + 0.02
          const pullStrength = 0.015 + data.midEnergy * 0.01
          particleVelocities[idx] = Math.cos(angle) * dist * pullStrength * 0.1
          particleVelocities[idx + 2] = Math.sin(angle) * dist * pullStrength * 0.1
        }
        
        // Reset if out of bounds
        if (particlePositions[idx + 1] > 12 || dist > 15) {
          const newAngle = Math.random() * Math.PI * 2
          const newRadius = Math.random() * 10
          particlePositions[idx] = Math.cos(newAngle) * newRadius
          particlePositions[idx + 1] = -2 + Math.random() * 2
          particlePositions[idx + 2] = Math.sin(newAngle) * newRadius
        }
        
        // Update colors
        const colorHue = (time * 0.05 + (i / WAVE_PARTICLES) * 0.8) % 1
        const color = new THREE.Color().setHSL(colorHue, 0.85, 0.6 + data.highEnergy * 0.3)
        particleColors[idx] = color.r
        particleColors[idx + 1] = color.g
        particleColors[idx + 2] = color.b
      }
      
      particleGeometry.attributes.position.needsUpdate = true
      particleGeometry.attributes.color.needsUpdate = true

      // Animate ribbons
      ribbons.forEach((ribbon, idx) => {
        const freqIndex = Math.floor((idx / ribbonCount) * data.frequencyData.length)
        const sample = data.frequencyData[freqIndex] / 255
        
        ribbon.position.y = 1 + sample * 3 * sensitivity
        ribbon.rotation.x = Math.sin(time + idx) * 0.3 + sample * 0.5
        ribbon.scale.y = 1 + sample * 0.8
        
        const material = ribbon.material as THREE.MeshStandardMaterial
        const hue = ((idx / ribbonCount) + time * 0.03) % 1
        material.color.setHSL(hue, 0.9, 0.5 + sample * 0.3)
        material.emissive.setHSL(hue, 1.0, 0.2 + sample * 0.4)
        material.emissiveIntensity = 0.8 + sample * 1.2
      })

      // Dynamic camera movement
      camera.position.y = 8 + Math.sin(time * 0.3) * 1.5 + data.bassEnergy * 2
      camera.position.z = 12 + Math.cos(time * 0.2) * 2
      camera.lookAt(0, 0, 0)

      // Dynamic lighting
      light3.intensity = 1.5 + data.overallVolume * 2.5
      light3.position.y = 10 + data.bassEnergy * 5
      light3.color.setHSL((time * 0.08) % 1, 1.0, 0.6)

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      waveGeometry.dispose()
      waveMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      ribbons.forEach((ribbon) => {
        ribbon.geometry.dispose()
        if (Array.isArray(ribbon.material)) {
          ribbon.material.forEach(m => m.dispose())
        } else {
          ribbon.material.dispose()
        }
      })
    }
  }, [sensitivity, theme])

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

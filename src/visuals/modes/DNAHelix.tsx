import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useCanvasLoop } from '../useCanvasLoop'
import type { VisualComponentProps } from '../types'
import { easeAudio } from '../utils/audio'
import { EASING_CURVES } from '../constants'
import { getMobileOptimizedSettings } from '../../utils/mobile'

// DNA Helix - Endless race through DNA tunnel with random obstacles
const SEGMENT_LENGTH = 2
const SEGMENTS_VISIBLE = 40
const HELIX_RADIUS = 4
const TUNNEL_SPEED_BASE = 0.3
const OBSTACLE_SPAWN_CHANCE = 0.05
const OBSTACLE_TYPES = 4

interface DNASegment {
  group: THREE.Group
  zPosition: number
  leftStrand: THREE.Mesh
  rightStrand: THREE.Mesh
  connection: THREE.Mesh
  leftBase: THREE.Mesh
  rightBase: THREE.Mesh
}

interface Obstacle {
  mesh: THREE.Mesh
  zPosition: number
  type: number
  rotationSpeed: number
  scale: number
}

export function DNAHelix({ sensitivity, theme }: VisualComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const segmentsRef = useRef<DNASegment[]>([])
  const obstaclesRef = useRef<Obstacle[]>([])
  const timeRef = useRef(0)
  const speedRef = useRef(TUNNEL_SPEED_BASE)
  const distanceTraveledRef = useRef(0)

  const mobileSettings = getMobileOptimizedSettings()

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.fog = new THREE.Fog(0x000510, 10, 80)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera
    camera.position.set(0, 0, 5)
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
    const ambientLight = new THREE.AmbientLight(0x202040, 0.4)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 50)
    pointLight1.position.set(0, 0, 10)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 50)
    pointLight2.position.set(0, 0, -10)
    scene.add(pointLight2)

    // Create initial DNA segments
    const strandGeometry = new THREE.CylinderGeometry(0.15, 0.15, SEGMENT_LENGTH, 8)
    const baseGeometry = new THREE.SphereGeometry(0.35, 12, 12)
    const connectionGeometry = new THREE.CylinderGeometry(0.08, 0.08, HELIX_RADIUS * 2, 6)
    connectionGeometry.rotateX(Math.PI / 2)

    for (let i = 0; i < SEGMENTS_VISIBLE; i++) {
      createDNASegment(i, strandGeometry, baseGeometry, connectionGeometry, scene)
    }

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
      strandGeometry.dispose()
      baseGeometry.dispose()
      connectionGeometry.dispose()
      segmentsRef.current.forEach(seg => {
        scene.remove(seg.group)
        seg.leftStrand.geometry.dispose()
        seg.rightStrand.geometry.dispose()
        seg.connection.geometry.dispose()
        seg.leftBase.geometry.dispose()
        seg.rightBase.geometry.dispose()
        if (!Array.isArray(seg.leftStrand.material)) seg.leftStrand.material.dispose()
        if (!Array.isArray(seg.rightStrand.material)) seg.rightStrand.material.dispose()
        if (!Array.isArray(seg.connection.material)) seg.connection.material.dispose()
        if (!Array.isArray(seg.leftBase.material)) seg.leftBase.material.dispose()
        if (!Array.isArray(seg.rightBase.material)) seg.rightBase.material.dispose()
      })
      obstaclesRef.current.forEach(obs => {
        scene.remove(obs.mesh)
        obs.mesh.geometry.dispose()
        if (!Array.isArray(obs.mesh.material)) obs.mesh.material.dispose()
      })
      scene.clear()
    }
  }, [sensitivity, theme, mobileSettings.quality, mobileSettings.resolutionScale])

  function createDNASegment(
    index: number,
    strandGeometry: THREE.BufferGeometry,
    baseGeometry: THREE.BufferGeometry,
    connectionGeometry: THREE.BufferGeometry,
    scene: THREE.Scene
  ) {
    const group = new THREE.Group()
    const zPosition = -index * SEGMENT_LENGTH
    group.position.z = zPosition

    const t = index / SEGMENTS_VISIBLE
    const angle = t * Math.PI * 2

    // Left strand
    const leftX = Math.cos(angle) * HELIX_RADIUS
    const leftY = Math.sin(angle) * HELIX_RADIUS
    const leftMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.6, 0.8, 0.6),
      emissive: new THREE.Color().setHSL(0.6, 1.0, 0.3),
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.5,
    })
    const leftStrand = new THREE.Mesh(strandGeometry, leftMaterial)
    leftStrand.position.set(leftX, leftY, 0)
    group.add(leftStrand)

    // Right strand
    const rightX = Math.cos(angle + Math.PI) * HELIX_RADIUS
    const rightY = Math.sin(angle + Math.PI) * HELIX_RADIUS
    const rightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.9, 0.8, 0.6),
      emissive: new THREE.Color().setHSL(0.9, 1.0, 0.3),
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.5,
    })
    const rightStrand = new THREE.Mesh(strandGeometry, rightMaterial)
    rightStrand.position.set(rightX, rightY, 0)
    group.add(rightStrand)

    // Connection between strands
    const connectionMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.1, 0.7, 0.5),
      emissive: new THREE.Color().setHSL(0.1, 1.0, 0.2),
      emissiveIntensity: 0.4,
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.7,
    })
    const connection = new THREE.Mesh(connectionGeometry, connectionMaterial)
    connection.position.set(0, 0, 0)
    connection.lookAt(rightX, rightY, 0)
    group.add(connection)

    // Base pairs (spheres)
    const leftBaseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.15, 0.9, 0.6),
      emissive: new THREE.Color().setHSL(0.15, 1.0, 0.3),
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.6,
    })
    const leftBase = new THREE.Mesh(baseGeometry, leftBaseMaterial)
    leftBase.position.set(leftX, leftY, 0)
    group.add(leftBase)

    const rightBaseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.55, 0.9, 0.6),
      emissive: new THREE.Color().setHSL(0.55, 1.0, 0.3),
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.6,
    })
    const rightBase = new THREE.Mesh(baseGeometry, rightBaseMaterial)
    rightBase.position.set(rightX, rightY, 0)
    group.add(rightBase)

    scene.add(group)

    segmentsRef.current.push({
      group,
      zPosition,
      leftStrand,
      rightStrand,
      connection,
      leftBase,
      rightBase,
    })
  }

  function createObstacle(scene: THREE.Scene) {
    const type = Math.floor(Math.random() * OBSTACLE_TYPES)
    let geometry: THREE.BufferGeometry
    
    switch (type) {
      case 0: // Torus
        geometry = new THREE.TorusGeometry(3, 0.5, 12, 24)
        break
      case 1: // Octahedron
        geometry = new THREE.OctahedronGeometry(2.5, 0)
        break
      case 2: // Icosahedron
        geometry = new THREE.IcosahedronGeometry(2.5, 0)
        break
      case 3: // Torus Knot
        geometry = new THREE.TorusKnotGeometry(2, 0.4, 64, 16)
        break
      default:
        geometry = new THREE.TorusGeometry(3, 0.5, 12, 24)
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
      emissive: new THREE.Color().setHSL(Math.random(), 1.0, 0.3),
      emissiveIntensity: 1.0,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8,
      wireframe: type % 2 === 0,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      -SEGMENTS_VISIBLE * SEGMENT_LENGTH
    )

    scene.add(mesh)

    obstaclesRef.current.push({
      mesh,
      zPosition: mesh.position.z,
      type,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      scale: 1 + Math.random() * 0.5,
    })
  }

  useCanvasLoop(
    canvasRef,
    (ctx, dims, frame) => {
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

      // Speed increases with audio energy
      speedRef.current = TUNNEL_SPEED_BASE + midEnergy * 0.8

      // Move DNA segments forward
      segmentsRef.current.forEach((segment) => {
        segment.group.position.z += speedRef.current
        segment.zPosition = segment.group.position.z

        // Pulse effect with audio
        const pulse = 1 + highEnergy * 0.2
        segment.leftBase.scale.setScalar(pulse)
        segment.rightBase.scale.setScalar(pulse)

        // Update colors
        const leftMat = segment.leftStrand.material as THREE.MeshStandardMaterial
        const rightMat = segment.rightStrand.material as THREE.MeshStandardMaterial
        leftMat.emissiveIntensity = 0.5 + bassEnergy * 0.8
        rightMat.emissiveIntensity = 0.5 + midEnergy * 0.8

        // Reset segment if it goes behind camera
        if (segment.zPosition > 10) {
          segment.group.position.z = -SEGMENTS_VISIBLE * SEGMENT_LENGTH
          segment.zPosition = segment.group.position.z

          // Randomly spawn obstacle
          if (Math.random() < OBSTACLE_SPAWN_CHANCE * (1 + highEnergy)) {
            createObstacle(sceneRef.current!)
          }
        }
      })

      // Move obstacles forward
      const updatedObstacles: Obstacle[] = []
      obstaclesRef.current.forEach(obstacle => {
        obstacle.mesh.position.z += speedRef.current
        obstacle.zPosition = obstacle.mesh.position.z

        // Rotate obstacle
        obstacle.mesh.rotation.x += obstacle.rotationSpeed * (1 + midEnergy)
        obstacle.mesh.rotation.y += obstacle.rotationSpeed * 0.7 * (1 + highEnergy)

        // Pulse with audio
        const scale = obstacle.scale * (1 + bassEnergy * 0.3)
        obstacle.mesh.scale.setScalar(scale)

        // Update color
        const material = obstacle.mesh.material as THREE.MeshStandardMaterial
        material.emissiveIntensity = 1.0 + highEnergy * 1.5
        material.color.setHSL((timeRef.current * 0.1 + obstacle.type * 0.25) % 1, 0.8, 0.5 + midEnergy * 0.3)

        // Remove if behind camera
        if (obstacle.zPosition < 15) {
          updatedObstacles.push(obstacle)
        } else {
          sceneRef.current!.remove(obstacle.mesh)
          obstacle.mesh.geometry.dispose()
          if (!Array.isArray(obstacle.mesh.material)) obstacle.mesh.material.dispose()
        }
      })
      obstaclesRef.current = updatedObstacles

      // Camera shake with bass
      cameraRef.current.position.x = Math.sin(timeRef.current * 2) * bassEnergy * 0.3
      cameraRef.current.position.y = Math.cos(timeRef.current * 1.5) * bassEnergy * 0.3
      cameraRef.current.lookAt(0, 0, -10)

      // Update distance traveled
      distanceTraveledRef.current += speedRef.current

      // Light pulsing
      const lights = sceneRef.current.children.filter(c => c instanceof THREE.PointLight) as THREE.PointLight[]
      if (lights[0]) {
        lights[0].intensity = 2 + bassEnergy * 3
        lights[0].position.z = 10 + Math.sin(timeRef.current) * 5
        lights[0].color.setHSL((timeRef.current * 0.1) % 1, 1, 0.7)
      }
      if (lights[1]) {
        lights[1].intensity = 2 + midEnergy * 3
        lights[1].position.z = -10 + Math.cos(timeRef.current * 0.7) * 5
        lights[1].color.setHSL((timeRef.current * 0.1 + 0.5) % 1, 1, 0.7)
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)

      // Draw HUD overlay
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`DISTANCE: ${Math.floor(distanceTraveledRef.current)}m`, 20, 40)
      ctx.font = '16px Arial'
      ctx.fillText(`SPEED: ${(speedRef.current * 100).toFixed(0)}%`, 20, 65)
      ctx.fillText(`OBSTACLES: ${obstaclesRef.current.length}`, 20, 90)
    },
    [sensitivity, theme],
  )

  return <canvas ref={canvasRef} className="block h-full min-h-[420px] w-full rounded-3xl bg-black/30" />
}

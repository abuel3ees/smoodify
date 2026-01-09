import { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface ScrollSceneProps {
  scrollProgress: number
  currentSection: number
}

function DataParticles({ scrollProgress, count = 800 }: { scrollProgress: number; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 10 + Math.random() * 15

      temp.push({
        position: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
        ),
        speed: 0.02 + Math.random() * 0.05,
        offset: Math.random() * Math.PI * 2,
        scale: 0.015 + Math.random() * 0.025,
      })
    }
    return temp
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime

    particles.forEach((particle, i) => {
      const { position, speed, offset, scale } = particle

      dummy.position.set(
        position.x + Math.sin(time * speed + offset) * 0.5,
        position.y + Math.cos(time * speed * 0.5 + offset) * 0.3,
        position.z + Math.sin(time * speed * 0.7 + offset) * 0.4,
      )

      const pulseScale = scale * (1 + Math.sin(time * 0.5 + offset) * 0.1)
      dummy.scale.setScalar(pulseScale)

      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#4a90e2" transparent opacity={0.35} />
    </instancedMesh>
  )
}

function DataStreams({ scrollProgress }: { scrollProgress: number }) {
  const linesRef = useRef<THREE.Group>(null)

  const curves = useMemo(() => {
    const temp = []
    for (let i = 0; i < 12; i++) {
      const points = []
      const startAngle = (i / 12) * Math.PI * 2
      const radius = 6 + Math.random() * 4

      for (let j = 0; j < 50; j++) {
        const t = j / 50
        const angle = startAngle + t * Math.PI * 2
        const y = (t - 0.5) * 25
        const r = radius * (1 + Math.sin(t * Math.PI) * 0.2)

        points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r))
      }

      temp.push(new THREE.CatmullRomCurve3(points))
    }
    return temp
  }, [])

  useFrame((state) => {
    if (!linesRef.current) return
    linesRef.current.rotation.y = state.clock.elapsedTime * 0.015 + scrollProgress * 0.5
  })

  return (
    <group ref={linesRef}>
      {curves.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 64, 0.015, 8, false]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#d4a950" : "#4a90e2"} transparent opacity={0.08} />
        </mesh>
      ))}
    </group>
  )
}

function CoreSphere({ scrollProgress, currentSection }: { scrollProgress: number; currentSection: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current || !innerRef.current || !outerRef.current || !ringsRef.current) return

    const time = state.clock.elapsedTime

    groupRef.current.rotation.y = time * 0.02 + scrollProgress * Math.PI * 0.5
    groupRef.current.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.2

    const targetScale = currentSection === 0 ? 1 : currentSection === 1 ? 1.2 : currentSection === 2 ? 0.9 : 1.1
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.01)

    const pulse = 1 + Math.sin(time * 0.5) * 0.03
    innerRef.current.scale.setScalar(pulse)

    ringsRef.current.rotation.x = time * 0.05
    ringsRef.current.rotation.z = time * 0.03
  })

  return (
    <group ref={groupRef}>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshBasicMaterial color="#d4a950" wireframe transparent opacity={0.25} />
      </mesh>

      <mesh ref={outerRef}>
        <icosahedronGeometry args={[2.5, 1]} />
        <meshBasicMaterial color="#4a90e2" wireframe transparent opacity={0.12} />
      </mesh>

      <group ref={ringsRef}>
        {[3, 3.8, 4.6].map((radius, i) => (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.4, i * 0.3, 0]}>
            <torusGeometry args={[radius, 0.008, 16, 100]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#4a90e2" : "#d4a950"} transparent opacity={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function CameraController({ scrollProgress, currentSection }: { scrollProgress: number; currentSection: number }) {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3(0, 0, 22))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    const cameraPositions = [
      new THREE.Vector3(0, 0, 22),
      new THREE.Vector3(4, 2, 20),
      new THREE.Vector3(-3, -1, 18),
      new THREE.Vector3(0, 4, 20),
      new THREE.Vector3(0, 0, 24),
    ]

    const lookAtPositions = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]

    const fromIndex = Math.min(currentSection, cameraPositions.length - 1)
    const toIndex = Math.min(currentSection + 1, cameraPositions.length - 1)
    const sectionProgress = (scrollProgress * 5) % 1

    targetPosition.current.lerpVectors(cameraPositions[fromIndex], cameraPositions[toIndex], sectionProgress)
    targetLookAt.current.lerpVectors(lookAtPositions[fromIndex], lookAtPositions[toIndex], sectionProgress)

    camera.position.lerp(targetPosition.current, 0.015)
    camera.lookAt(targetLookAt.current)
  })

  return null
}

function GridFloor({ scrollProgress }: { scrollProgress: number }) {
  const gridRef = useRef<THREE.GridHelper>(null)

  useFrame(() => {
    if (!gridRef.current) return
    gridRef.current.position.y = -12 + scrollProgress * 2
    ;(gridRef.current.material as THREE.Material).opacity = 0.06
  })

  return <gridHelper ref={gridRef} args={[100, 40, "#4a90e2", "#1a1d2e"]} position={[0, -12, 0]} />
}

function Scene({ scrollProgress, currentSection }: ScrollSceneProps) {
  return (
    <>
      <color attach="background" args={["#0c0d14"]} />
      <fog attach="fog" args={["#0c0d14", 20, 60]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#4a90e2" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#d4a950" />

      <CameraController scrollProgress={scrollProgress} currentSection={currentSection} />
      <CoreSphere scrollProgress={scrollProgress} currentSection={currentSection} />
      <DataParticles scrollProgress={scrollProgress} />
      <DataStreams scrollProgress={scrollProgress} />
      <GridFloor scrollProgress={scrollProgress} />
    </>
  )
}

export function ScrollScene({ scrollProgress, currentSection }: ScrollSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 22], fov: 55 }}>
      <Scene scrollProgress={scrollProgress} currentSection={currentSection} />
    </Canvas>
  )
}

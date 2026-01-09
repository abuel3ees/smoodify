import { useRef, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere } from "@react-three/drei"
import * as THREE from "three"

function AudioSphere() {
  const sphereRef = useRef<THREE.Mesh>(null)
  const pointsRef = useRef<THREE.Points>(null)

  useEffect(() => {
    if (pointsRef.current) {
      const positions = new Float32Array(500 * 3)
      for (let i = 0; i < 500; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const radius = 2 + Math.random() * 0.5

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)
      }
      pointsRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    }
  }, [])

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.1
      sphereRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.2
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <group>
      {/* Main sphere */}
      <Sphere ref={sphereRef} args={[2, 32, 32]}>
        <meshStandardMaterial color="#4a90e2" wireframe transparent opacity={0.3} />
      </Sphere>

      {/* Inner sphere */}
      <Sphere args={[1.5, 32, 32]}>
        <meshStandardMaterial color="#d4a950" wireframe transparent opacity={0.2} />
      </Sphere>

      {/* Particle cloud */}
      <points ref={pointsRef}>
        <bufferGeometry />
        <pointsMaterial size={0.02} color="#4a90e2" transparent opacity={0.6} />
      </points>

      {/* Orbital rings */}
      {[0, 60, 120].map((rotation, i) => (
        <group key={i} rotation={[0, 0, (rotation * Math.PI) / 180]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.5, 0.01, 16, 100]} />
            <meshBasicMaterial color="#d4a950" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function AudioVisualization() {
  return (
    <div className="w-full h-[400px] md:h-[500px] bg-card border border-border rounded-sm relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground tracking-wider">AUDIO VISUALIZATION</p>
        <p className="text-xs font-mono text-foreground">Valence × Energy × Tempo</p>
      </div>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={["#1a1d2e"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4a90e2" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#d4a950" />
        <AudioSphere />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      <div className="absolute bottom-4 right-4 space-y-1 text-right">
        <div className="flex items-center gap-2 justify-end">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-[10px] font-mono text-muted-foreground">LIVE ANALYSIS</span>
        </div>
      </div>
    </div>
  )
}

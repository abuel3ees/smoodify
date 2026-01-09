"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, MeshDistortMaterial, Environment, Stars } from "@react-three/drei"
import type * as THREE from "three"

function AnimatedSphere({
  scrollProgress,
  position,
  color,
  speed,
  distort,
}: {
  scrollProgress: number
  position: [number, number, number]
  color: string
  speed: number
  distort: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.15 * speed
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.2 * speed
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3
  })

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} scale={1 + scrollProgress * 0.5}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={distort + scrollProgress * 0.2}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  )
}

function ParticleField({ scrollProgress }: { scrollProgress: number }) {
  const particlesRef = useRef<THREE.Points>(null)
  const count = 2000

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30

      const colorChoice = Math.random()
      if (colorChoice < 0.33) {
        colors[i * 3] = 0.13
        colors[i * 3 + 1] = 0.83
        colors[i * 3 + 2] = 0.93
      } else if (colorChoice < 0.66) {
        colors[i * 3] = 0.23
        colors[i * 3 + 1] = 0.51
        colors[i * 3 + 2] = 0.96
      } else {
        colors[i * 3] = 0.96
        colors[i * 3 + 1] = 0.25
        colors[i * 3 + 2] = 0.37
      }
    }

    return [positions, colors]
  }, [])

  useFrame((state) => {
    if (!particlesRef.current) return
    particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
    particlesRef.current.rotation.x = scrollProgress * 0.5
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.6 + scrollProgress * 0.4} sizeAttenuation />
    </points>
  )
}

function WaveRing({ scrollProgress, index }: { scrollProgress: number; index: number }) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ringRef.current) return
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.1 * (index % 2 === 0 ? 1 : -1)
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2 + index) * 0.2
    ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.3 + index * 0.5) * 0.1)
  })

  const colors = ["#22d3ee", "#3b82f6", "#f43f5e"]

  return (
    <mesh ref={ringRef} position={[0, 0, -5 - index * 2]}>
      <torusGeometry args={[3 + index * 1.5, 0.02, 16, 100]} />
      <meshBasicMaterial color={colors[index % 3]} transparent opacity={0.3 - index * 0.05} />
    </mesh>
  )
}

function Scene({ scrollProgress, currentSection }: { scrollProgress: number; currentSection: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = scrollProgress * Math.PI * 0.5
    groupRef.current.position.z = -scrollProgress * 5
  })

  return (
    <group ref={groupRef}>
      <AnimatedSphere scrollProgress={scrollProgress} position={[-3, 0, 0]} color="#22d3ee" speed={1.2} distort={0.4} />
      <AnimatedSphere scrollProgress={scrollProgress} position={[3, 1, -2]} color="#3b82f6" speed={0.8} distort={0.3} />
      <AnimatedSphere scrollProgress={scrollProgress} position={[0, -2, -1]} color="#f43f5e" speed={1} distort={0.5} />
      <ParticleField scrollProgress={scrollProgress} />
      {[0, 1, 2, 3, 4].map((i) => (
        <WaveRing key={i} scrollProgress={scrollProgress} index={i} />
      ))}
    </group>
  )
}

export function ScrollScene({ scrollProgress, currentSection }: { scrollProgress: number; currentSection: number }) {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 2]}>
        <color attach="background" args={["#030712"]} />
        <fog attach="fog" args={["#030712", 10, 30]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#22d3ee" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f43f5e" />
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Scene scrollProgress={scrollProgress} currentSection={currentSection} />
        <Environment preset="night" />
      </Canvas>
    </div>
  )
}

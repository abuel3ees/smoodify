

import React, { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  Environment,
  Float,
  Sparkles,
  Stars,
  Html,
  useTexture,
} from "@react-three/drei"
import { Music, Sparkles as SparklesIcon } from "lucide-react"

/* ----------------------------- small helpers ---------------------------- */

function clamp(n, a = 0, b = 1) {
  return Math.max(a, Math.min(b, n))
}
function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Scroll progress for a specific element:
 * 0 when the element just enters viewport from below
 * 1 when it fully passes through to above
 */
function useScrollDrive(targetRef) {
  const [state, setState] = useState({ progress: 0, velocity: 0, inView: true })
  const last = useRef({ p: 0, t: performance.now() })
  const raf = useRef(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const el = targetRef.current
    if (!el) return

    let inView = true
    const io = new IntersectionObserver(
      (entries) => {
        inView = Boolean(entries?.[0]?.isIntersecting)
        setState((s) => ({ ...s, inView }))
      },
      { threshold: 0.01 }
    )
    io.observe(el)

    const tick = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1

      // progress through viewport: 0 -> 1
      // when rect.top == vh => 0, when rect.bottom == 0 => 1
      const raw = (vh - rect.top) / (vh + rect.height)
      const p = clamp(raw, 0, 1)

      const now = performance.now()
      const dt = Math.max(16, now - last.current.t)
      const dp = p - last.current.p
      const vel = clamp(Math.abs(dp) / (dt / 1000), 0, 4) // ~0..4

      last.current = { p, t: now }

      setState((s) => {
        // small smoothing so it feels premium
        const sp = lerp(s.progress, p, 0.18)
        const sv = lerp(s.velocity, vel, 0.2)
        return { ...s, progress: sp, velocity: sv, inView }
      })

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf.current)
      io.disconnect()
    }
  }, [targetRef])

  return state
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(Boolean(m.matches))
    update()
    m.addEventListener?.("change", update)
    return () => m.removeEventListener?.("change", update)
  }, [])
  return reduced
}

/* ------------------------------- 3D Scene ------------------------------ */

function ScrollAudioCore({ drive }) {
  const group = useRef(null)
  const rings = useRef([])
  const bars = useRef(null)
  const core = useRef(null)

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 72
  const radius = 2.55

  // ring refs helper
  const setRingRef = (i) => (el) => {
    rings.current[i] = el
  }

  useFrame((state) => {
    const { camera, clock } = state
    const t = clock.getElapsedTime()

    // If element is offscreen, keep it calm (perf + vibe)
    const inView = drive.inView
    const p = inView ? drive.progress : drive.progress * 0.6
    const v = inView ? drive.velocity : 0

    // Camera "dolly" based on scroll
    const targetZ = lerp(7.2, 5.4, p)
    camera.position.z = lerp(camera.position.z, targetZ, 0.06)
    camera.position.x = lerp(camera.position.x, lerp(-0.1, 0.25, p), 0.05)
    camera.lookAt(0, 0, 0)

    // Primary motion: scroll-driven rotation + micro-life
    const scrollRot = p * Math.PI * 4.6
    const micro = (inView ? 1 : 0.35) * (0.16 + p * 0.22)

    if (group.current) {
      group.current.rotation.y = lerp(group.current.rotation.y, scrollRot, 0.08)
      group.current.rotation.x = lerp(
        group.current.rotation.x,
        Math.sin(t * 0.45) * 0.18 + p * 0.18,
        0.06
      )
      group.current.rotation.z = lerp(
        group.current.rotation.z,
        Math.cos(t * 0.25) * 0.10 - p * 0.08,
        0.06
      )
    }

    // Rings: staggered scroll offsets + subtle wobble
    rings.current.forEach((r, i) => {
      if (!r) return
      const k = i * 0.65 + 0.2
      r.rotation.z = lerp(r.rotation.z, scrollRot * k, 0.08)
      r.rotation.x = lerp(
        r.rotation.x,
        Math.sin(t * (0.35 + i * 0.08)) * 0.22,
        0.06
      )
    })

    // Core breathing based on scroll + velocity
    if (core.current) {
      const s = 1 + Math.sin(t * (0.9 + p)) * (0.02 + p * 0.02) + v * 0.01
      core.current.scale.setScalar(lerp(core.current.scale.x, s, 0.10))
      core.current.rotation.y += micro * 0.02
    }

    // Radial bars: “audio energy” driven by scroll + time + velocity
    if (bars.current) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2
        const x = Math.cos(a) * radius
        const y = Math.sin(a) * radius

        const wave =
          0.5 +
          0.5 *
            Math.sin(t * (1.15 + p * 0.85) + i * 0.35 + p * 3.1)

        const base = 0.28 + p * 0.55
        const spike = wave * (0.7 + p * 0.65) + v * 0.25
        const h = clamp(base + spike * 0.9, 0.18, 2.1)

        dummy.position.set(x, y, 0)
        dummy.rotation.set(0, 0, a + Math.PI / 2)
        dummy.scale.set(0.06, h, 0.06)
        dummy.updateMatrix()
        bars.current.setMatrixAt(i, dummy.matrix)
      }
      bars.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      {/* radial bars */}
      <instancedMesh ref={bars} args={[null, null, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={"#7dd3fc"} // light-cyan
          emissive={"#60a5fa"} // blue
          emissiveIntensity={0.85}
          metalness={0.15}
          roughness={0.35}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      {/* outer aura ring */}
      <mesh>
        <torusGeometry args={[2.75, 0.022, 18, 220]} />
        <meshBasicMaterial
          color={"#f472b6"} // pink
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* rings (3 axes) */}
      {[0, 60, 120].map((deg, i) => (
        <group key={i} ref={setRingRef(i)} rotation={[0, 0, (deg * Math.PI) / 180]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.32, 0.014, 16, 200]} />
            <meshBasicMaterial
              color={i % 2 ? "#22d3ee" : "#60a5fa"}
              transparent
              opacity={0.30}
            />
          </mesh>
        </group>
      ))}

      {/* core glassy blob */}
      <Float speed={0.8} rotationIntensity={0.3} floatIntensity={0.45}>
        <mesh ref={core} castShadow receiveShadow>
          <icosahedronGeometry args={[1.25, 6]} />
          {/* MeshTransmissionMaterial is available in drei; gives "glass" look */}
          <meshPhysicalMaterial
            color={"#0ea5e9"}
            roughness={0.22}
            metalness={0.05}
            transmission={0.92}
            thickness={1.0}
            ior={1.2}
            clearcoat={1}
            clearcoatRoughness={0.18}
            emissive={"#1d4ed8"}
            emissiveIntensity={0.22}
          />
        </mesh>

        {/* inner wireframe */}
        <mesh>
          <sphereGeometry args={[0.92, 32, 32]} />
          <meshStandardMaterial
            color={"#fde68a"}
            wireframe
            transparent
            opacity={0.14}
            emissive={"#f59e0b"}
            emissiveIntensity={0.25}
          />
        </mesh>
      </Float>

      {/* sparkles */}
      <Sparkles
        count={140}
        scale={[7, 7, 7]}
        size={2.0}
        speed={0.35}
        opacity={0.55}
        color={"#a5b4fc"}
      />
    </group>
  )
}

function Scene({ drive, reduced }) {
  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 6, 14]} />

      {/* lights */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 8]} intensity={0.75} color={"#93c5fd"} />
      <pointLight position={[-6, -4, 6]} intensity={0.95} color={"#22d3ee"} />
      <pointLight position={[6, -2, -6]} intensity={0.55} color={"#fb7185"} />

      {/* background stars */}
      <Stars radius={60} depth={26} count={2200} factor={3.2} saturation={0} fade speed={0.3} />

      {/* reflections */}
      <Environment preset="city" />

      {/* actual viz */}
      <ScrollAudioCore drive={reduced ? { ...drive, velocity: 0 } : drive} />
    </>
  )
}

/* ------------------------------ Main Export ----------------------------- */

export function AudioVisualization() {
  const wrapRef = useRef(null)
  const reduced = usePrefersReducedMotion()
  const drive = useScrollDrive(wrapRef)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-[420px] md:h-[540px] overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* premium gradient frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.14), transparent 55%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.14), transparent 55%), radial-gradient(circle at 50% 90%, rgba(244,63,94,0.10), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(circle at 50% 35%, black 55%, transparent 80%)",
        }}
      />

      {/* UI overlay */}
      <div className="absolute top-4 left-4 z-10 space-y-1">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl border border-border/60 bg-background/40 backdrop-blur">
            <SparklesIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider">
              SCROLL-DRIVEN AUDIO VISUAL
            </p>
            <p className="text-xs font-mono text-foreground flex items-center gap-2">
              <Music className="h-3.5 w-3.5" />
              Valence × Energy × Tempo
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 text-right space-y-1">
        <div className="inline-flex items-center gap-2 justify-end rounded-full border border-border/60 bg-background/40 px-3 py-1 backdrop-blur">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(34,211,238,1), rgba(59,130,246,1), rgba(244,63,94,1))",
              boxShadow: "0 0 16px rgba(59,130,246,0.45)",
            }}
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            {drive.inView ? "SCROLL ACTIVE" : "PAUSED (OFFSCREEN)"}
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          progress: {(drive.progress * 100).toFixed(0)}%
        </div>
      </div>

      {/* Canvas */}
      <div className="absolute inset-0">
        {!mounted ? null : (
          <Canvas
            camera={{ position: [0.1, 0.0, 7.2], fov: 45 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
          >
            <Scene drive={drive} reduced={reduced} />
          </Canvas>
        )}
      </div>
    </div>
  )
}
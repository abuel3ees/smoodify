"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import {
  Waves,
  ArrowRight,
  ArrowDown,
  Play,
  Terminal,
  Database,
  Server,
  Cpu,
  Activity,
  Radio,
  Volume2,
} from "lucide-react"
import { ScrollScene } from "@/components/scroll-scene"
import { GlitchText } from "@/components/glitch-text"
import { MagneticButton } from "@/components/magnetic-button"
import { SplitText } from "@/components/split-text"
import { RevealSection } from "@/components/reveal-section"
import { FloatingStats } from "@/components/floating-stats"
import { FeatureGrid } from "@/components/feature-grid"
import { Marquee } from "@/components/marquee"
import { CodeBlock } from "@/components/code-block"

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

const techStack = [
  "REDIS STREAMS",
  "POSTGRESQL",
  "WEBGL",
  "TENSORFLOW.JS",
  "NEXT.JS",
  "REACT THREE FIBER",
  "FRAMER MOTION",
  "TYPESCRIPT",
  "AWS LAMBDA",
  "CLOUDFLARE WORKERS",
  "DRIZZLE ORM",
  "TAILWIND",
]

export default function Home() {
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [vh, setVh] = useState(1)
  const rawScroll = useRef(0)
  const [scrollY, setScrollY] = useState(0)
  const [currentSection, setCurrentSection] = useState(0)
  const raf = useRef(0)
  const lastSection = useRef(-1)
  const [mounted, setMounted] = useState(false)

  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9])

  useEffect(() => {
    setMounted(true)
    if (typeof window === "undefined") return

    const syncVh = () => setVh(window.innerHeight || 1)
    syncVh()

    const onScroll = () => {
      rawScroll.current = window.scrollY || 0
    }

    const tick = () => {
      setScrollY((prev) => (reduceMotion ? rawScroll.current : lerp(prev, rawScroll.current, 0.12)))
      const h = window.innerHeight || 1
      const idx = Math.max(0, Math.floor((rawScroll.current + h * 0.3) / h))
      if (idx !== lastSection.current) {
        lastSection.current = idx
        setCurrentSection(idx)
      }
      raf.current = requestAnimationFrame(tick)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", syncVh, { passive: true })
    onScroll()
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", syncVh)
      cancelAnimationFrame(raf.current)
    }
  }, [reduceMotion])

  const scrollProgress = useMemo(() => {
    return vh > 0 ? clamp(scrollY / (vh * 6), 0, 1) : 0
  }, [scrollY, vh])

  const headerSolid = scrollY > 100

  if (!mounted) return null

  return (
    <div ref={containerRef} className="bg-[#030712] text-white selection:bg-cyan-500/30">
      {/* Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
        style={{
          scaleX: scrollProgress,
          background: "linear-gradient(90deg, #22d3ee, #3b82f6, #f43f5e)",
        }}
      />

      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <ScrollScene scrollProgress={scrollProgress} currentSection={currentSection} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030712]/50 to-[#030712]" />
      </div>

      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between">
          <motion.div className="flex items-center gap-4" whileHover={{ scale: 1.02 }}>
            <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center bg-cyan-500/10">
              <Waves className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tighter">SMOODIFY</span>
              <span className="text-[10px] font-mono text-white/40 tracking-[0.3em]">AUDIO INTELLIGENCE</span>
            </div>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8">
            {["FEATURES", "TECH", "PIPELINE", "DEMO"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs font-mono text-white/50 hover:text-white transition-colors relative group"
                whileHover={{ y: -2 }}
              >
                <span className="text-cyan-400/50 mr-1">0{i + 1}</span>
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>

          <MagneticButton variant="outline" className="hidden md:flex">
            <Terminal className="w-4 h-4" />
            <a href="dashboard"> LAUNCH APP </a>
          </MagneticButton>
        </div>
      </motion.header>

      {/* HERO - Asymmetric Left-aligned */}
      <section className="relative min-h-screen flex items-center">
        <motion.div
          className="relative z-10 w-full px-6 md:px-12 lg:px-24 pt-32"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="max-w-7xl">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="h-px w-16 bg-gradient-to-r from-cyan-400 to-transparent" />
              <span className="text-xs font-mono text-cyan-400 tracking-[0.3em]">
                NEURAL AUDIO PATTERN INTELLIGENCE
              </span>
            </motion.div>

            {/* Main Title - Massive, Left-aligned */}
            <div className="mb-12">
              <motion.h1
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-[12vw] md:text-[10vw] lg:text-[8vw] font-bold leading-[0.85] tracking-tighter"
              >
                <span className="block">YOUR MUSIC</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-rose-500">
                  <GlitchText delay={800}>DECODED.</GlitchText>
                </span>
              </motion.h1>
            </div>

            {/* Description - Right side offset */}
            <div className="grid md:grid-cols-2 gap-12 items-end">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-xl">
                  Cloud-native mood analytics powered by deep learning. We extract emotional signatures from audio
                  features—valence, energy, tempo—and map your listening patterns across time.
                </p>
                <div className="flex items-center gap-6 mt-8">
                  <MagneticButton>
                    <Play className="w-4 h-4" />
                    START ANALYSIS
                    <ArrowRight className="w-4 h-4" />
                  </MagneticButton>
                  <MagneticButton variant="ghost">VIEW DEMO</MagneticButton>
                </div>
              </motion.div>

              {/* Live Metrics Panel */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="hidden md:block"
              >
                <div className="border border-white/10 bg-black/40 backdrop-blur-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono text-white/50">LIVE SYSTEM STATUS</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs font-mono text-emerald-400">OPERATIONAL</span>
                    </span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "TRACKS/SEC", value: "12,847" },
                      { label: "AVG LATENCY", value: "8ms" },
                      { label: "QUEUE DEPTH", value: "3.2K" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-xs font-mono text-white/30">{item.label}</span>
                        <span className="text-lg font-mono text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator - Bottom Left */}
        <motion.div
          className="absolute bottom-12 left-6 md:left-12 z-10 flex items-center gap-4"
          animate={{ opacity: scrollY > 100 ? 0 : 1 }}
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}>
            <ArrowDown className="w-5 h-5 text-white/30" />
          </motion.div>
          <span className="text-xs font-mono text-white/30 tracking-wider">SCROLL TO EXPLORE</span>
        </motion.div>
      </section>

      {/* TECH MARQUEE */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-black/40 backdrop-blur-sm">
        <Marquee speed={30}>
          {techStack.map((tech, i) => (
            <span key={i} className="mx-12 text-sm font-mono text-white/20 hover:text-white/60 transition-colors">
              {tech}
            </span>
          ))}
        </Marquee>
      </section>

      {/* STATS SECTION - Full Width */}
      <section className="relative z-10 py-32 px-6 md:px-12 lg:px-24">
        <RevealSection direction="up">
          <FloatingStats />
        </RevealSection>
      </section>

      {/* FEATURES - Asymmetric Grid */}
      <section id="features" className="relative z-10 py-32 px-6 md:px-12 lg:px-24">
        <RevealSection direction="left" className="mb-20">
          <div className="flex items-end gap-8">
            <div>
              <span className="text-xs font-mono text-cyan-400 tracking-[0.3em] block mb-4">01 // CAPABILITIES</span>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">
                <SplitText>ENGINEERED FOR</SplitText>
                <br />
                <span className="text-white/30">
                  <SplitText delay={0.3}>AUDIO INTELLIGENCE</SplitText>
                </span>
              </h2>
            </div>
          </div>
        </RevealSection>
        <FeatureGrid />
      </section>

      {/* PIPELINE SECTION - Split Layout */}
      <section id="pipeline" className="relative z-10 py-32 px-6 md:px-12 lg:px-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <RevealSection direction="left">
            <span className="text-xs font-mono text-rose-400 tracking-[0.3em] block mb-4">02 // ARCHITECTURE</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">
              <SplitText>REAL-TIME</SplitText>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-blue-500">
                PROCESSING PIPELINE
              </span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-xl">
              Our distributed system processes millions of audio features per second. Redis Streams handle ingestion,
              PostgreSQL stores patterns, and edge workers run inference—all with P99 latency under 15ms.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Database, label: "POSTGRESQL" },
                { icon: Server, label: "REDIS STREAMS" },
                { icon: Cpu, label: "EDGE WORKERS" },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3 border border-white/10 bg-white/5"
                  whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.3)" }}
                >
                  <item.icon className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </RevealSection>
          <RevealSection direction="right">
            <CodeBlock />
          </RevealSection>
        </div>
      </section>

      {/* WAVEFORM VISUAL */}
      <section className="relative z-10 py-32 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          {Array.from({ length: 60 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 mx-[2px] bg-gradient-to-t from-cyan-400 via-blue-500 to-rose-500"
              animate={{
                height: [20, Math.random() * 200 + 50, 20],
              }}
              transition={{
                duration: 1 + Math.random(),
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.02,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center px-6">
          <RevealSection direction="up">
            <span className="text-xs font-mono text-blue-400 tracking-[0.3em] block mb-6">03 // VISUALIZATION</span>
            <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6">
              <SplitText>SEE YOUR</SplitText>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-500">
SOUND
              </span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Every frequency, every beat, every emotional shift—visualized in real-time through WebGL-powered graphics
              that respond to your music.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* CTA SECTION - Dramatic */}
      <section id="demo" className="relative z-10 py-48 px-6 md:px-12 lg:px-24">
        <div className="relative">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-rose-500/10 blur-3xl" />

          <div className="relative border border-white/10 bg-black/60 backdrop-blur-xl p-12 md:p-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 mb-6"
                >
                  <Radio className="w-5 h-5 text-rose-400" />
                  <span className="text-xs font-mono text-rose-400 tracking-[0.3em]">DEMO MODE AVAILABLE</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                  <SplitText>READY TO</SplitText>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-blue-500 to-cyan-400">
DECODE YOUR MUSIC?
                  </span>
                </h2>
                <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-xl">
                  Spotify integration is temporarily paused. Launch the demo to explore the full analytics pipeline with
                  synthetic data—same algorithms, same insights.
                </p>
                <div className="flex flex-wrap gap-4">
                  <MagneticButton>
                    <Volume2 className="w-4 h-4" />
                    <a href="dashboard">LAUNCH DEMO</a>
                    <ArrowRight className="w-4 h-4" />
                  </MagneticButton>
                  <MagneticButton variant="outline">VIEW DOCUMENTATION</MagneticButton>
                </div>
              </div>

              {/* Tech Specs */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-6"
              >
                {[
                  { label: "QUEUE", value: "REDIS", sub: "STREAMS" },
                  { label: "STORAGE", value: "RDS", sub: "POSTGRES" },
                  { label: "COMPUTE", value: "ECS", sub: "FARGATE" },
                  { label: "ML", value: "SAGE", sub: "MAKER" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="p-6 border border-white/5 bg-white/[0.02]"
                    whileHover={{ borderColor: "rgba(255,255,255,0.2)" }}
                  >
                    <span className="text-[10px] font-mono text-white/30 block mb-3">{item.label}</span>
                    <span className="text-3xl font-bold font-mono block text-white">{item.value}</span>
                    <span className="text-xs font-mono text-cyan-400">{item.sub}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-black/80 backdrop-blur-sm">
        <div className="px-6 md:px-12 lg:px-24 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 border border-cyan-500/50 flex items-center justify-center">
                  <Waves className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="font-bold">SMOODIFY</span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed">
                Neural audio pattern intelligence for the modern listener.
              </p>
            </div>
            {[
              { title: "PRODUCT", links: ["Features", "Pipeline", "Pricing", "Changelog"] },
              { title: "COMPANY", links: ["About", "Blog", "Careers", "Press"] },
              { title: "LEGAL", links: ["Privacy", "Terms", "Security", "GDPR"] },
            ].map((col) => (
              <div key={col.title}>
                <span className="text-xs font-mono text-white/30 tracking-wider block mb-4">{col.title}</span>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs font-mono text-white/20">© 2026 SMOODIFY. ALL RIGHTS RESERVED.</span>
            <div className="flex items-center gap-6">
              {["TWITTER", "GITHUB", "DISCORD"].map((social) => (
                <a key={social} href="#" className="text-xs font-mono text-white/30 hover:text-white transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

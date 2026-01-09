// resources/js/Pages/Home.jsx
// (Revamped for Laravel + Inertia + Vite + shadcn)
// - Removed Next "use client"
// - Removed TypeScript generics
// - Uses Inertia router for actions
// - Guards window usage
// - Keeps your cinematic scroll landing intact

import React, { useEffect, useMemo, useRef, useState } from "react"
import { router } from "@inertiajs/react"
import { ScrollScene } from "@/components/scroll-scene"
import { DataSection } from "@/components/data-section"
import { ArchitectureSection } from "@/components/architecture-section"
import { InsightsSection } from "@/components/insights-section"
import { Waves, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Home({ spotifyOnHold = true }) {
  const [scrollY, setScrollY] = useState(0)
  const [vh, setVh] = useState(1)
  const [currentSection, setCurrentSection] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const syncVh = () => setVh(window.innerHeight || 1)
    syncVh()

    const handleScroll = () => {
      const y = window.scrollY || 0
      setScrollY(y)
      const section = Math.floor(y / (window.innerHeight || 1))
      setCurrentSection(section)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", syncVh)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", syncVh)
    }
  }, [])

  const scrollProgress = useMemo(() => {
    return vh > 0 ? scrollY / (vh * 5) : 0
  }, [scrollY, vh])

  const getConnectOpacity = () => {
    if (vh <= 0) return 0
    return Math.min(1, Math.max(0, (scrollY - vh * 3.5) / (vh * 0.5)))
  }

  const getConnectTransform = () => {
    if (vh <= 0) return 0
    return Math.max(0, 50 - (scrollY - vh * 3.5) * 0.08)
  }

  const navItems = useMemo(
    () => [
      { label: "Origin", idx: 0 },
      { label: "Architecture", idx: 1 },
      { label: "Analysis", idx: 2 },
      { label: "Insights", idx: 3 },
      { label: "Connect", idx: 4 },
    ],
    []
  )

  const scrollToSection = (i) => {
    if (typeof window === "undefined") return
    window.scrollTo({ top: i * vh, behavior: "smooth" })
  }

  const onInitialize = () => {
    // Spotify on hold → generate demo data + queue analysis + land on dashboard
    router.post(
      "/demo-data/generate",
      {},
      {
        preserveScroll: true,
        onSuccess: () => router.visit("/dashboard"),
      }
    )
  }

  const onConnect = () => {
    // Keep button + messaging for later; for now we route to dashboard with a flash idea
    // (If you want a flash, do it server-side. This is a UX fallback.)
    router.visit("/dashboard")
  }

  return (
    <div ref={containerRef} className="bg-background text-foreground">
      {/* Cinematic background */}
      <div className="fixed inset-0 z-0">
        <ScrollScene scrollProgress={scrollProgress} currentSection={currentSection} />
      </div>

      {/* Top header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
        style={{
          opacity: scrollY > 100 ? 1 : 0.86,
          backgroundColor: scrollY > 100 ? "rgba(12, 13, 20, 0.9)" : "transparent",
          backdropFilter: scrollY > 100 ? "blur(12px)" : "none",
        }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-primary/50 flex items-center justify-center bg-primary/10">
              <Waves className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-mono font-bold tracking-tight">smoodify.</h1>
              {spotifyOnHold && (
                <Badge variant="secondary" className="font-mono text-[10px] tracking-wider">
                  SPOTIFY INTEGRATION ON HOLD
                </Badge>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map(({ label, idx }) => (
              <button
                key={label}
                onClick={() => scrollToSection(idx)}
                className={`px-3 py-1 text-xs font-mono transition-all duration-500 ${
                  currentSection === idx
                    ? "text-foreground bg-primary/20 border border-primary/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Section 0: Hero */}
      <section className="relative h-screen flex items-center justify-center">
        <div
          className="relative z-10 text-center px-6 max-w-4xl mx-auto transition-all duration-700 ease-out"
          style={{
            transform: `translateY(${scrollY * 0.15}px)`,
            opacity: Math.max(0, 1 - scrollY * 0.0015),
          }}
        >
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground mb-6 border border-border/50 px-3 py-1 bg-background/50 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 bg-primary animate-pulse" />
            <span className="tracking-wider">AUDIO PATTERN INTELLIGENCE</span>
          </div>

          <h2 className="text-5xl md:text-8xl font-bold leading-none tracking-tighter mb-6 text-balance">
            Your Music
            <br />
            <span className="text-primary">Reveals You</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Cloud-native mood analytics from audio features (valence + energy). Background processing with Redis queues.
            Behavioral patterns by day-of-week and time-of-day.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              className="font-mono tracking-wide px-8 py-6"
              onClick={onInitialize}
            >
              Initialize Analysis
              <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Button>

            <div className="text-xs font-mono text-muted-foreground">
              {spotifyOnHold
                ? "Demo mode: generates data, queues analysis, and opens your dashboard."
                : "Connect Spotify to start analysis."}
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground transition-opacity duration-700"
          style={{ opacity: Math.max(0, 1 - scrollY * 0.008) }}
        >
          <span className="text-xs font-mono tracking-wider">SCROLL TO EXPLORE</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </section>

      {/* Section 1: Architecture */}
      <section className="relative min-h-screen flex items-center">
        <ArchitectureSection scrollY={scrollY} sectionStart={1} />
      </section>

      {/* Section 2: Data Analysis */}
      <section className="relative min-h-screen flex items-center">
        <DataSection scrollY={scrollY} sectionStart={2} />
      </section>

      {/* Section 3: Insights */}
      <section className="relative min-h-screen flex items-center">
        <InsightsSection scrollY={scrollY} sectionStart={3} />
      </section>

      {/* Section 4: Connect */}
      <section className="relative h-screen flex items-center justify-center">
        <div
          className="relative z-10 text-center px-6 max-w-3xl mx-auto transition-all duration-700 ease-out"
          style={{
            opacity: getConnectOpacity(),
            transform: `translateY(${getConnectTransform()}px)`,
          }}
        >
          <p className="text-xs font-mono text-muted-foreground tracking-wider mb-4">BEGIN YOUR ANALYSIS</p>

          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
            {spotifyOnHold ? (
              <>
                Launch Your
                <br />
                <span className="text-secondary">Demo Pipeline</span>
              </>
            ) : (
              <>
                Connect Your
                <br />
                <span className="text-secondary">Spotify Account</span>
              </>
            )}
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            {spotifyOnHold
              ? "Spotify ingestion is temporarily disabled. The analytics pipeline and pattern detection remain fully functional using demo or uploaded datasets."
              : "Secure OAuth integration with encrypted token storage. Your data remains yours."}
          </p>

          <Button
            variant={spotifyOnHold ? "secondary" : "outline"}
            size="lg"
            className="font-mono tracking-wide px-10 py-6 border-2"
            onClick={spotifyOnHold ? onInitialize : onConnect}
          >
            {spotifyOnHold ? "Generate & Analyze" : "Authenticate with Spotify"}
            <span className="inline-block ml-3 transition-transform duration-300 group-hover:translate-x-2">→</span>
          </Button>

          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">Redis</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Queue Processing</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">RDS</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Persistent Storage</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">ECS</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Fargate Runtime</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 border border-primary/50 flex items-center justify-center">
                <Waves className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-mono text-muted-foreground">smoodify.</span>
            </div>

            <div className="flex gap-6 text-xs font-mono text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors duration-300">
                Privacy
              </a>
              <a href="/terms" className="hover:text-foreground transition-colors duration-300">
                Terms
              </a>
              <a href="/dashboard" className="hover:text-foreground transition-colors duration-300">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
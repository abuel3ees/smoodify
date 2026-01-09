"use client"

import { useRef, useEffect, useState } from "react"
import { ScrollScene } from "@/components/scroll-scene"
import { DataSection } from "@/components/data-section"
import { ArchitectureSection } from "@/components/architecture-section"
import { InsightsSection } from "@/components/insights-section"
import { Waves, ChevronDown } from "lucide-react"

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [vh, setVh] = useState(1)
  const [currentSection, setCurrentSection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVh(window.innerHeight)

    const handleScroll = () => {
      setScrollY(window.scrollY)
      const section = Math.floor(window.scrollY / window.innerHeight)
      setCurrentSection(section)
    }

    const handleResize = () => {
      setVh(window.innerHeight)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const scrollProgress = vh > 0 ? scrollY / (vh * 5) : 0

  const getConnectOpacity = () => {
    if (vh <= 0) return 0
    return Math.min(1, Math.max(0, (scrollY - vh * 3.5) / (vh * 0.5)))
  }

  const getConnectTransform = () => {
    if (vh <= 0) return 0
    return Math.max(0, 50 - (scrollY - vh * 3.5) * 0.08)
  }

  return (
    <div ref={containerRef} className="bg-background">
      <div className="fixed inset-0 z-0">
        <ScrollScene scrollProgress={scrollProgress} currentSection={currentSection} />
      </div>

      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
        style={{
          opacity: scrollY > 100 ? 1 : 0.8,
          backgroundColor: scrollY > 100 ? "rgba(12, 13, 20, 0.9)" : "transparent",
          backdropFilter: scrollY > 100 ? "blur(12px)" : "none",
        }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-primary/50 flex items-center justify-center bg-primary/10">
              <Waves className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-mono font-bold tracking-tight text-foreground">smoodify.</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {["Origin", "Architecture", "Analysis", "Insights", "Connect"].map((label, i) => (
              <button
                key={i}
                onClick={() => window.scrollTo({ top: i * vh, behavior: "smooth" })}
                className={`px-3 py-1 text-xs font-mono transition-all duration-500 ${
                  currentSection === i
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
            Automated correlation of Spotify audio features with emotional patterns. Zero-trust architecture. Real-time
            behavioral insights.
          </p>

          <div className="flex flex-col items-center gap-8">
            <button className="group px-8 py-4 bg-primary text-primary-foreground font-mono text-sm tracking-wide hover:bg-primary/90 transition-all duration-300">
              Initialize Analysis
              <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
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
            Connect Your
            <br />
            <span className="text-secondary">Spotify Account</span>
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Secure OAuth integration with encrypted token storage. Your data remains yours.
          </p>

          <button className="group px-10 py-5 border-2 border-secondary text-secondary font-mono tracking-wide hover:bg-secondary hover:text-secondary-foreground transition-all duration-500">
            Authenticate with Spotify
            <span className="inline-block ml-3 transition-transform duration-300 group-hover:translate-x-2">→</span>
          </button>

          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">256-bit</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">AES Encryption</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">Zero</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Trust Policy</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">AWS</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">KMS Managed</p>
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
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                API
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

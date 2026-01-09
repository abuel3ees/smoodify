import { useEffect, useState } from "react"

interface DataSectionProps {
  scrollY: number
  sectionStart: number
}

const dataPoints = [
  { label: "Valence", value: 0.642, description: "Emotional positivity index" },
  { label: "Energy", value: 0.718, description: "Audio intensity measure" },
  { label: "Danceability", value: 0.534, description: "Rhythmic consistency" },
  { label: "Tempo", value: 0.856, description: "Normalized BPM score" },
]

export function DataSection({ scrollY, sectionStart }: DataSectionProps) {
  const [vh, setVh] = useState(0)

  useEffect(() => {
    setVh(window.innerHeight)
  }, [])

  const sectionProgress = Math.max(0, Math.min(1, (scrollY - vh * sectionStart) / vh + 0.5))

  return (
    <div className="container mx-auto px-6 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Metrics */}
        <div
          style={{
            opacity: sectionProgress,
            transform: `translateX(${(1 - sectionProgress) * -50}px)`,
          }}
        >
          <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">AUDIO FEATURES</p>
          <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-balance">Real-Time Analysis</h3>

          <div className="space-y-6">
            {dataPoints.map((point, i) => {
              const barProgress = Math.max(0, Math.min(1, (sectionProgress - i * 0.1) / 0.6))

              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-sm">{point.label}</span>
                    <span className="font-mono text-2xl font-bold">{(point.value * barProgress).toFixed(3)}</span>
                  </div>
                  <div className="h-2 bg-muted border border-border/50 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-700 ease-out"
                      style={{ width: `${point.value * barProgress * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{point.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Correlation Matrix */}
        <div
          style={{
            opacity: sectionProgress,
            transform: `translateX(${(1 - sectionProgress) * 50}px)`,
          }}
        >
          <div className="p-6 border border-border/50 bg-background/60 backdrop-blur-sm">
            <div className="mb-4">
              <p className="text-xs font-mono text-muted-foreground tracking-wider mb-1">CORRELATION MATRIX</p>
              <h4 className="font-bold">Feature Relationships</h4>
            </div>

            <div className="grid grid-cols-5 gap-1 text-xs font-mono">
              <div />
              {["V", "E", "D", "T"].map((label) => (
                <div key={label} className="text-center text-muted-foreground py-2">
                  {label}
                </div>
              ))}

              {[
                ["V", 1.0, 0.73, 0.45, 0.32],
                ["E", 0.73, 1.0, 0.68, 0.54],
                ["D", 0.45, 0.68, 1.0, 0.71],
                ["T", 0.32, 0.54, 0.71, 1.0],
              ].map((row, i) => (
                <>
                  <div key={`label-${i}`} className="text-muted-foreground py-2 text-center">
                    {row[0]}
                  </div>
                  {(row.slice(1) as number[]).map((val, j) => {
                    const intensity = val as number
                    const cellProgress = Math.max(0, Math.min(1, (sectionProgress - (i + j) * 0.05) / 0.5))

                    return (
                      <div
                        key={`${i}-${j}`}
                        className="aspect-square flex items-center justify-center border border-border/30 transition-all duration-500"
                        style={{
                          backgroundColor: `rgba(74, 144, 226, ${intensity * cellProgress * 0.5})`,
                          opacity: 0.5 + cellProgress * 0.5,
                        }}
                      >
                        {(intensity * cellProgress).toFixed(2)}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border/30 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">Avg Correlation</p>
                <p className="text-2xl font-bold font-mono">{(0.58 * sectionProgress).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">Confidence</p>
                <p className="text-2xl font-bold font-mono">{(94 * sectionProgress).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

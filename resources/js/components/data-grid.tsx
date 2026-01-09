import { Card } from "@/components/ui/card"

const dataPoints = [
  { time: "00:00", valence: 0.65, energy: 0.72, tempo: 128, mood: "Energetic" },
  { time: "04:00", valence: 0.45, energy: 0.38, tempo: 95, mood: "Reflective" },
  { time: "08:00", valence: 0.71, energy: 0.81, tempo: 135, mood: "Motivated" },
  { time: "12:00", valence: 0.58, energy: 0.62, tempo: 118, mood: "Focused" },
  { time: "16:00", valence: 0.52, energy: 0.55, tempo: 110, mood: "Calm" },
  { time: "20:00", valence: 0.68, energy: 0.75, tempo: 125, mood: "Uplifted" },
]

export function DataGrid() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Time-based chart */}
      <Card className="p-6 bg-card border-border/50">
        <div className="mb-6">
          <p className="text-xs font-mono text-muted-foreground tracking-wider mb-1">TEMPORAL ANALYSIS</p>
          <h4 className="text-lg font-bold">24-Hour Listening Pattern</h4>
        </div>
        <div className="space-y-3">
          {dataPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground w-12">{point.time}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-8 bg-muted border border-border relative overflow-hidden">
                  <div
                    className="h-full bg-primary/30 border-r-2 border-primary"
                    style={{ width: `${point.valence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono w-20 text-muted-foreground">{point.mood}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Low Valence</span>
          <span>High Valence</span>
        </div>
      </Card>

      {/* Feature correlation */}
      <Card className="p-6 bg-card border-border/50">
        <div className="mb-6">
          <p className="text-xs font-mono text-muted-foreground tracking-wider mb-1">FEATURE CORRELATION</p>
          <h4 className="text-lg font-bold">Energy × Valence Matrix</h4>
        </div>
        <div className="aspect-square bg-muted border border-border relative">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="border border-border/30" />
            ))}
          </div>

          {/* Data points */}
          {dataPoints.map((point, i) => (
            <div
              key={i}
              className="absolute h-3 w-3 -ml-1.5 -mt-1.5 bg-primary border-2 border-primary-foreground rounded-full hover:scale-150 transition-transform cursor-pointer"
              style={{
                left: `${point.valence * 100}%`,
                bottom: `${point.energy * 100}%`,
              }}
              title={`${point.mood} - V:${point.valence} E:${point.energy}`}
            />
          ))}

          {/* Axis labels */}
          <div className="absolute -bottom-6 left-0 right-0 text-center text-xs font-mono text-muted-foreground">
            Valence →
          </div>
          <div className="absolute -left-12 top-0 bottom-0 flex items-center">
            <span className="text-xs font-mono text-muted-foreground -rotate-90">Energy →</span>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Correlation</p>
            <p className="text-2xl font-bold font-mono">0.73</p>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Confidence</p>
            <p className="text-2xl font-bold font-mono">94%</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

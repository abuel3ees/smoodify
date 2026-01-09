"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

const metrics = [
  {
    label: "Avg Valence",
    value: "0.642",
    change: "+12.3%",
    trend: "up",
    description: "Positivity in listening patterns",
  },
  {
    label: "Avg Energy",
    value: "0.718",
    change: "+8.7%",
    trend: "up",
    description: "Intensity of audio features",
  },
  {
    label: "Tempo Variance",
    value: "23.4 BPM",
    change: "-5.2%",
    trend: "down",
    description: "Consistency in listening pace",
  },
  {
    label: "Pattern Score",
    value: "87.3",
    change: "+15.8%",
    trend: "up",
    description: "Behavioral correlation index",
  },
]

export function MetricsPanel() {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <Card key={i} className="p-6 bg-card border-border/50 hover:border-primary/30 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="h-8 w-8 bg-muted border border-border flex items-center justify-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-mono ${
                metric.trend === "up" ? "text-primary" : "text-secondary"
              }`}
            >
              {metric.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{metric.change}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider">{metric.label}</p>
            <p className="text-3xl font-bold font-mono tracking-tight">{metric.value}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{metric.description}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Brain, Clock, Activity } from "lucide-react"

interface InsightsSectionProps {
  scrollY: number
  sectionStart: number
}

const insights = [
  {
    icon: TrendingUp,
    title: "Mood Trajectory",
    value: "+23%",
    description: "Valence increase over past 30 days",
  },
  {
    icon: Brain,
    title: "Pattern Detected",
    value: "Cyclical",
    description: "7-day emotional rhythm identified",
  },
  {
    icon: Clock,
    title: "Peak Hours",
    value: "14:00-18:00",
    description: "Highest energy listening period",
  },
  {
    icon: Activity,
    title: "Consistency",
    value: "87%",
    description: "Behavioral pattern reliability",
  },
]

export function InsightsSection({ scrollY, sectionStart }: InsightsSectionProps) {
  const [vh, setVh] = useState(0)

  useEffect(() => {
    setVh(window.innerHeight)
  }, [])

  const sectionProgress = Math.max(0, Math.min(1, (scrollY - vh * sectionStart) / vh + 0.5))

  return (
    <div className="container mx-auto px-6 relative z-10">
      <div
        className="text-center mb-12"
        style={{
          opacity: sectionProgress,
          transform: `translateY(${(1 - sectionProgress) * 30}px)`,
        }}
      >
        <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">BEHAVIORAL INSIGHTS</p>
        <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
          AI-Powered
          <span className="text-secondary"> Pattern Recognition</span>
        </h3>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, i) => {
          const delay = i * 0.12
          const itemProgress = Math.max(0, Math.min(1, (sectionProgress - delay) / 0.6))
          const Icon = insight.icon

          return (
            <div
              key={i}
              className="p-6 border border-border/50 bg-background/60 backdrop-blur-sm text-center"
              style={{
                opacity: itemProgress,
                transform: `translateY(${(1 - itemProgress) * 30}px) rotateX(${(1 - itemProgress) * 10}deg)`,
              }}
            >
              <div className="h-12 w-12 border border-secondary/50 bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-6 w-6 text-secondary" />
              </div>
              <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">{insight.title}</p>
              <p className="text-3xl font-bold font-mono mb-2">{insight.value}</p>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </div>
          )
        })}
      </div>

      {/* Timeline visualization */}
      <div
        className="mt-12 p-6 border border-border/50 bg-background/60 backdrop-blur-sm"
        style={{
          opacity: sectionProgress,
          transform: `scale(${0.95 + sectionProgress * 0.05})`,
        }}
      >
        <div className="mb-4">
          <p className="text-xs font-mono text-muted-foreground tracking-wider mb-1">EMOTIONAL TIMELINE</p>
          <h4 className="font-bold">30-Day Mood Progression</h4>
        </div>

        <div className="h-32 flex items-end justify-between gap-1">
          {Array.from({ length: 30 }).map((_, i) => {
            const height = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 30
            const barProgress = Math.max(0, Math.min(1, (sectionProgress - i * 0.02) / 0.5))

            return (
              <div
                key={i}
                className="flex-1 bg-primary/30 hover:bg-primary/50 transition-colors cursor-pointer"
                style={{
                  height: `${height * barProgress}%`,
                  opacity: 0.4 + barProgress * 0.6,
                }}
              />
            )
          })}
        </div>

        <div className="mt-4 flex justify-between text-xs font-mono text-muted-foreground">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}

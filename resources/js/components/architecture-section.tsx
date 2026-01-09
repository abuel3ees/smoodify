"use client"

import { useEffect, useState } from "react"
import { Database, Server, Shield, Zap } from "lucide-react"

interface ArchitectureSectionProps {
  scrollY: number
  sectionStart: number
}

const features = [
  {
    icon: Server,
    title: "AWS Fargate",
    subtitle: "Serverless Containers",
    description: "Scalable execution without infrastructure management",
    color: "primary",
  },
  {
    icon: Database,
    title: "Amazon RDS",
    subtitle: "MySQL Persistence",
    description: "High-availability data storage with automated backups",
    color: "secondary",
  },
  {
    icon: Zap,
    title: "ElastiCache",
    subtitle: "Redis Queues",
    description: "Background processing for intensive analysis tasks",
    color: "accent",
  },
  {
    icon: Shield,
    title: "AWS KMS",
    subtitle: "Zero-Trust Security",
    description: "Encrypted credential storage and token management",
    color: "chart-4",
  },
]

export function ArchitectureSection({ scrollY, sectionStart }: ArchitectureSectionProps) {
  const [vh, setVh] = useState(0)

  useEffect(() => {
    setVh(window.innerHeight)
  }, [])

  const sectionProgress = Math.max(0, Math.min(1, (scrollY - vh * sectionStart) / vh + 0.5))

  return (
    <div className="container mx-auto px-6 relative z-10">
      <div
        className="mb-12"
        style={{
          opacity: sectionProgress,
          transform: `translateY(${(1 - sectionProgress) * 50}px)`,
        }}
      >
        <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">CLOUD ARCHITECTURE</p>
        <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">Enterprise Infrastructure</h3>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, i) => {
          const delay = i * 0.15
          const itemProgress = Math.max(0, Math.min(1, (sectionProgress - delay) / 0.7))
          const Icon = feature.icon

          return (
            <div
              key={i}
              className="group p-6 border border-border/50 bg-background/60 backdrop-blur-sm hover:border-primary/50 transition-all duration-500"
              style={{
                opacity: itemProgress,
                transform: `translateY(${(1 - itemProgress) * 40}px) scale(${0.9 + itemProgress * 0.1})`,
              }}
            >
              <div
                className={`h-12 w-12 border flex items-center justify-center mb-4 transition-colors duration-300
                  ${feature.color === "primary" ? "border-primary/50 bg-primary/10 group-hover:bg-primary/20" : ""}
                  ${feature.color === "secondary" ? "border-secondary/50 bg-secondary/10 group-hover:bg-secondary/20" : ""}
                  ${feature.color === "accent" ? "border-accent/50 bg-accent/10 group-hover:bg-accent/20" : ""}
                  ${feature.color === "chart-4" ? "border-chart-4/50 bg-chart-4/10 group-hover:bg-chart-4/20" : ""}
                `}
              >
                <Icon
                  className={`h-6 w-6 
                    ${feature.color === "primary" ? "text-primary" : ""}
                    ${feature.color === "secondary" ? "text-secondary" : ""}
                    ${feature.color === "accent" ? "text-accent" : ""}
                    ${feature.color === "chart-4" ? "text-chart-4" : ""}
                  `}
                />
              </div>
              <h4 className="font-mono text-lg font-bold mb-1">{feature.title}</h4>
              <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">{feature.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

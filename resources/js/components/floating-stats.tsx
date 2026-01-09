"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const stats = [
  { label: "TRACKS ANALYZED", value: 847293, suffix: "+" },
  { label: "MOOD PATTERNS", value: 156, suffix: "K" },
  { label: "ACCURACY RATE", value: 99.7, suffix: "%" },
  { label: "LATENCY", value: 12, suffix: "ms" },
]

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const interval = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(interval)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [value])

  return (
    <span className="tabular-nums">
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

export function FloatingStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.6 }}
          className="group"
        >
          <div className="text-3xl md:text-5xl font-bold font-mono text-white mb-2 group-hover:text-cyan-400 transition-colors">
            <AnimatedNumber value={stat.value} suffix={stat.suffix} />
          </div>
          <div className="text-[10px] md:text-xs font-mono text-white/50 tracking-[0.2em]">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

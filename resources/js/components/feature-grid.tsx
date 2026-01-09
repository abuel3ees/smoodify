"use client"

import { motion } from "framer-motion"
import { Zap, Brain, Lock, LineChart, Layers, Cpu } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Neural Mood Mapping",
    description: "Deep learning models trained on 50M+ tracks to decode emotional signatures in audio waveforms.",
    color: "#22d3ee",
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description: "Stream processing pipeline handles 100K events/sec with sub-12ms latency via Redis Streams.",
    color: "#3b82f6",
  },
  {
    icon: Lock,
    title: "Zero-Knowledge Auth",
    description: "Encrypted OAuth tokens with automatic rotation. Your listening data never touches our servers.",
    color: "#f43f5e",
  },
  {
    icon: LineChart,
    title: "Behavioral Analytics",
    description: "Temporal pattern detection across day/week/season cycles. Discover your hidden listening rhythms.",
    color: "#22d3ee",
  },
  {
    icon: Layers,
    title: "Multi-Source Fusion",
    description: "Aggregate insights across Spotify, Apple Music, and local libraries into unified dashboard.",
    color: "#3b82f6",
  },
  {
    icon: Cpu,
    title: "Edge Inference",
    description: "ML models run client-side for privacy. No audio ever leaves your device during analysis.",
    color: "#f43f5e",
  },
]

export function FeatureGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
          className="group p-8 border border-white/5 bg-black/20 backdrop-blur-sm cursor-pointer transition-colors"
        >
          <motion.div
            className="mb-6 w-12 h-12 flex items-center justify-center border border-white/10"
            whileHover={{ rotate: 90, borderColor: feature.color }}
            transition={{ duration: 0.3 }}
          >
            <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
          </motion.div>
          <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
            {feature.title}
          </h3>
          <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
        </motion.div>
      ))}
    </div>
  )
}

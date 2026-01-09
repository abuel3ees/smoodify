"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const codeSnippets = [
  {
    lang: "typescript",
    code: `// Real-time mood analysis pipeline
const analyzeMood = async (track: AudioFeatures) => {
  const { valence, energy, tempo } = track;
  
  const moodVector = await neuralNet.infer({
    input: [valence, energy, tempo / 200],
    model: 'mood-classifier-v3'
  });
  
  return {
    primary: MOOD_LABELS[argmax(moodVector)],
    confidence: max(moodVector),
    timestamp: Date.now()
  };
};`,
  },
]

export function CodeBlock() {
  const [visibleLines, setVisibleLines] = useState(0)
  const lines = codeSnippets[0].code.split("\n")

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => (prev < lines.length ? prev + 1 : prev))
    }, 100)
    return () => clearInterval(interval)
  }, [lines.length])

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 font-mono text-sm overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        <span className="ml-4 text-white/30 text-xs">mood-analyzer.ts</span>
      </div>
      <pre className="text-white/80 leading-relaxed">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <span className="w-8 text-white/20 select-none">{i + 1}</span>
            <span
              dangerouslySetInnerHTML={{
                __html: line
                  .replace(/(const|let|async|await|return)/g, '<span class="text-rose-400">$1</span>')
                  .replace(/(\{|\}|\[|\])/g, '<span class="text-white/50">$1</span>')
                  .replace(/(\/\/.*)/g, '<span class="text-white/30">$1</span>')
                  .replace(/('.*?')/g, '<span class="text-cyan-400">$1</span>'),
              }}
            />
          </motion.div>
        ))}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
          className="inline-block w-2 h-4 bg-cyan-400 ml-1"
        />
      </pre>
    </motion.div>
  )
}

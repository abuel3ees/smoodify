"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function GlitchText({
  children,
  className = "",
  delay = 0,
}: {
  children: string
  className?: string
  delay?: number
}) {
  const [displayText, setDisplayText] = useState("")
  const [isGlitching, setIsGlitching] = useState(false)
  const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~"

  useEffect(() => {
    const text = children
    let currentIndex = 0
    let glitchInterval: NodeJS.Timeout

    const startAnimation = () => {
      const revealInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex) + chars[Math.floor(Math.random() * chars.length)])
          currentIndex++
        } else {
          setDisplayText(text)
          clearInterval(revealInterval)
        }
      }, 40)

      return revealInterval
    }

    const timeout = setTimeout(() => {
      const interval = startAnimation()
      return () => clearInterval(interval)
    }, delay)

    // Random glitch effect
    const glitchTrigger = setInterval(() => {
      if (Math.random() > 0.95) {
        setIsGlitching(true)
        setTimeout(() => setIsGlitching(false), 100)
      }
    }, 100)

    return () => {
      clearTimeout(timeout)
      clearInterval(glitchTrigger)
    }
  }, [children, delay])

  return (
    <motion.span
      className={`relative inline-block ${className}`}
      style={{
        textShadow: isGlitching ? "2px 0 #f43f5e, -2px 0 #22d3ee" : "none",
        transform: isGlitching ? `translateX(${Math.random() * 4 - 2}px)` : "none",
      }}
    >
      {displayText || children}
    </motion.span>
  )
}

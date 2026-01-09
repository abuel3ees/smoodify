"use client"

import type React from "react"

import { useRef } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"

export function RevealSection({
  children,
  className = "",
  direction = "left",
}: {
  children: React.ReactNode
  className?: string
  direction?: "left" | "right" | "up"
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const x = useTransform(
    scrollYProgress,
    [0, 0.5],
    direction === "left" ? [-100, 0] : direction === "right" ? [100, 0] : [0, 0],
  )
  const y = useTransform(scrollYProgress, [0, 0.5], direction === "up" ? [100, 0] : [0, 0])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  return (
    <motion.div ref={ref} style={{ x, y, opacity }} className={className}>
      {children}
    </motion.div>
  )
}

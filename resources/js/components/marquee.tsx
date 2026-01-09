"use client"

import type React from "react"

import { motion } from "framer-motion"

export function Marquee({ children, speed = 20 }: { children: React.ReactNode; speed?: number }) {
  return (
    <div className="relative overflow-hidden whitespace-nowrap">
      <motion.div
        className="inline-flex"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
}

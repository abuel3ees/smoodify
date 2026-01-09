"use client"

import type React from "react"

import { useRef, useState } from "react"
import { motion } from "framer-motion"

export function MagneticButton({
  children,
  onClick,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "outline" | "ghost"
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setPosition({ x: x * 0.3, y: y * 0.3 })
  }

  const reset = () => setPosition({ x: 0, y: 0 })

  const baseStyles = "relative overflow-hidden font-mono tracking-wide uppercase text-sm transition-all duration-300"
  const variantStyles = {
    primary: "bg-white text-black px-8 py-4 hover:bg-cyan-400",
    outline: "border-2 border-white/30 text-white px-8 py-4 hover:border-white hover:bg-white/10",
    ghost: "text-white/70 hover:text-white px-4 py-2",
  }

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 350, damping: 20, mass: 0.5 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-3">{children}</span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-rose-500 opacity-0"
        whileHover={{ opacity: 0.2 }}
      />
    </motion.button>
  )
}

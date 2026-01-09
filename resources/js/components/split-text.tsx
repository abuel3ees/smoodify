"use client"

import React, { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"

type SplitTextProps = {
  children: string
  className?: string
  /** delay before the first token animates */
  delay?: number
  /** time between tokens */
  stagger?: number
  /** animate by "word" or "char" */
  mode?: "word" | "char"
  /** only animate once when it enters view */
  once?: boolean
  /** how much of the element must be in view (0..1) */
  amount?: number
}

/**
 * A clean, reliable SplitText:
 * - Works in React/Laravel/Inertia (no funky measurement)
 * - Preserves spaces & newlines
 * - "word" or "char" mode
 * - Reduced-motion safe
 * - No margin hacks that break wrapping
 */
export function SplitText({
  children,
  className = "",
  delay = 0,
  stagger = 0.03,
  mode = "word",
  once = true,
  amount = 0.6,
}: SplitTextProps) {
  const reduceMotion = useReducedMotion()

  const tokens = useMemo(() => {
    const text = String(children ?? "")
    if (mode === "char") {
      // Keep every character (including spaces/newlines) so layout is identical
      return Array.from(text)
    }
    // Words + whitespace tokens so spacing/newlines are preserved
    return text.match(/\S+|\s+/g) ?? []
  }, [children, mode])

  const container = {
    hidden: { opacity: reduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { delayChildren: delay, staggerChildren: stagger },
    },
  } as const

  const item = {
    hidden: reduceMotion ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 14, filter: "blur(6px)" },
    show: reduceMotion
      ? { opacity: 1, y: 0, filter: "blur(0px)" }
      : {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { type: "spring", stiffness: 220, damping: 22, mass: 0.7 },
        },
  } as const

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount, margin: "0px 0px -10% 0px" }}
      // keeps whitespace/newlines identical to the original string
      style={{ whiteSpace: "pre-wrap", display: "inline", willChange: reduceMotion ? "auto" : "opacity, transform" }}
      aria-label={String(children ?? "")}
    >
      {tokens.map((t, i) => {
        const isSpace = t === " " || t === "\n" || /^\s+$/.test(t)

        // For whitespace: render plain text (no animation) so wrapping never breaks
        if (isSpace) {
          return (
            <span key={`s-${i}`} aria-hidden>
              {t}
            </span>
          )
        }

        // For visible tokens: animate each token but keep them inline
        return (
          <motion.span
            key={`t-${i}`}
            variants={item}
            aria-hidden
            style={{
              display: "inline-block",
              willChange: reduceMotion ? "auto" : "opacity, transform",
            }}
          >
            {t}
          </motion.span>
        )
      })}
    </motion.span>
  )
}
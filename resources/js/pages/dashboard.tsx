import React, { useEffect, useMemo, useRef, useState } from "react"
import { Head, router, usePage } from "@inertiajs/react"
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Command as CommandIcon,
  Download,
  Flame,
  Heart,
  LineChart,
  ListFilter,
  Music,
  RefreshCcw,
  Search,
  Settings2,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

// Shadcn/ui (optional). If your project doesn't have these, swap with plain divs.
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"

// ---------------- Types ----------------

type DailyPoint = {
  day: string // "2026-01-09"
  avg_valence?: number | string | null
  avg_energy?: number | string | null
  events_count?: number | string | null
}

type Pattern = {
  id?: number | string
  title: string
  summary?: string
  pattern_key?: string
  meta?: {
    avg_energy?: number | null
    avg_valence?: number | null
    confidence?: number | null // 0..1 (optional)
    impact?: number | null // -1..+1 (optional)
  }
}

type Stats = {
  daysCount?: number
  eventsCount?: number
  avgValence?: number
  avgEnergy?: number
  streakDays?: number
  valenceTrendPct?: number
  energyTrendPct?: number
}

type Props = {
  stats?: Stats
  dailySeries?: DailyPoint[]
  patterns?: Pattern[]
  user?: { name?: string }
  rangeLabel?: string
}

// ---------------- Utils ----------------

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function toNum(v: any): number | null {
  const n = typeof v === "string" ? parseFloat(v) : v
  return Number.isFinite(n) ? (n as number) : null
}

function toInt(v: any): number {
  const n = typeof v === "string" ? parseFloat(v) : v
  return Number.isFinite(n) ? Math.max(0, Math.round(n as number)) : 0
}

function fmtPct(n?: number) {
  if (n === undefined || n === null || !Number.isFinite(n)) return null
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

function fmt01(n?: number | null) {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—"
  return clamp01(n).toFixed(2)
}

function fmtInt(n?: number | null) {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—"
  return Math.round(n).toLocaleString()
}

function niceDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00")
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function parseISO(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return Number.isNaN(d.getTime()) ? null : d
}

function weekdayShort(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" })
}

function percentile(values: number[], p: number) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  const w = idx - lo
  return sorted[lo] * (1 - w) + sorted[hi] * w
}

function pearson(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length)
  if (n < 3) return null
  const x = xs.slice(0, n)
  const y = ys.slice(0, n)
  const mx = x.reduce((a, b) => a + b, 0) / n
  const my = y.reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const vx = x[i] - mx
    const vy = y[i] - my
    num += vx * vy
    dx += vx * vx
    dy += vy * vy
  }
  if (dx === 0 || dy === 0) return null
  return num / Math.sqrt(dx * dy)
}

function movingAverage(values: Array<number | null>, window = 7) {
  const out: Array<number | null> = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1).filter((v): v is number => v !== null && Number.isFinite(v))
    out.push(slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null)
  }
  return out
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return v
}

function useAnimatedNumber(target: number | null | undefined, durationMs = 800) {
  const reduceMotion = useReducedMotion()
  const [val, setVal] = useState<number>(Number.isFinite(target as any) ? (target as number) : 0)
  const prevRef = useRef<number>(val)

  useEffect(() => {
    const t = Number.isFinite(target as any) ? (target as number) : 0
    if (reduceMotion) {
      setVal(t)
      prevRef.current = t
      return
    }

    const from = prevRef.current
    const to = t
    const start = performance.now()

    let raf = 0
    const tick = (now: number) => {
      const dt = now - start
      const p = Math.min(1, dt / durationMs)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(from + (to - from) * e)
      if (p < 1) raf = requestAnimationFrame(tick)
      else prevRef.current = to
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, reduceMotion])

  return val
}

// ---------------- Theme (DEFAULT DARK) ----------------

type ThemeMode = "dark" | "light"
const THEME_KEY = "smoodify_theme"

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark"
  const saved = window.localStorage.getItem(THEME_KEY) as ThemeMode | null
  if (saved === "dark" || saved === "light") return saved
  return "dark" // ✅ default
}

// ---------------- Visuals ----------------

function AmbientBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Light */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(60%_70%_at_50%_0%,rgba(16,185,129,0.08),transparent_60%)]" />
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(55%_65%_at_0%_55%,rgba(59,130,246,0.10),transparent_55%)]" />
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(55%_65%_at_100%_65%,rgba(244,63,94,0.08),transparent_55%)]" />

      {/* Dark */}
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(60%_70%_at_50%_0%,rgba(16,185,129,0.18),transparent_62%)]" />
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(55%_65%_at_0%_55%,rgba(59,130,246,0.20),transparent_58%)]" />
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(55%_65%_at_100%_65%,rgba(244,63,94,0.16),transparent_58%)]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]
                   [background-image:linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)]
                   dark:[background-image:linear-gradient(to_right,rgba(244,244,245,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(244,244,245,0.06)_1px,transparent_1px)]
                   [background-size:32px_32px]"
      />

      {/* Top glow blob */}
      <div
        className="absolute -top-44 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full
                   bg-gradient-to-b from-zinc-100 to-transparent blur-3xl
                   dark:from-zinc-800/60"
      />
    </div>
  )
}

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur",
        "border-zinc-200/70 bg-white/70 text-zinc-700",
        "dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300",
        className
      )}
    >
      {children}
    </span>
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800/60", className)} />
}

function AnimatedStat({ value, format }: { value: number | null | undefined; format: (n: number) => string }) {
  const v = useAnimatedNumber(value)
  return <>{format(v)}</>
}

function TrendBadge({ pct }: { pct?: number }) {
  const t = fmtPct(pct)
  if (!t) return null
  const up = pct! >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        up
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
      )}
    >
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {t}
    </span>
  )
}

function TooltipCard({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null

  const map = payload.reduce((acc: any, item: any) => {
    acc[item.dataKey] = item.value
    return acc
  }, {})

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{niceDateLabel(label || "")}</div>
      <div className="mt-2 grid gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4" /> Valence
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{fmt01(map.avg_valence)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Energy
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{fmt01(map.avg_energy)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <Music className="h-4 w-4" /> Plays
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{fmtInt(map.events_count)}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------- Drawer + Command Palette ----------------

function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          />
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
          >
            <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
                <Button variant="outline" className="rounded-2xl" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

type CmdAction = { id: string; name: string; hint?: string; group: string; run: () => void }

function CommandPalette({
  open,
  onClose,
  actions,
}: {
  open: boolean
  onClose: () => void
  actions: CmdAction[]
}) {
  const [q, setQ] = useState("")
  const reduceMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setQ("")
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return actions
    return actions.filter((a) => `${a.name} ${a.hint ?? ""} ${a.group}`.toLowerCase().includes(query))
  }, [q, actions])

  const grouped = useMemo(() => {
    const m = new Map<string, CmdAction[]>()
    for (const a of filtered) {
      const arr = m.get(a.group) ?? []
      arr.push(a)
      m.set(a.group, arr)
    }
    return [...m.entries()]
  }, [filtered])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Enter" && filtered[0]) {
        filtered[0].run()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose, filtered])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          />
          <motion.div
            className="fixed left-1/2 top-20 z-50 w-[92vw] max-w-2xl -translate-x-1/2 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            initial={{ y: -10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
          >
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
                <Search className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <input
                  ref={inputRef as any}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Type a command… (Enter runs the first result)"
                  className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-500 outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
                <Chip className="ml-2 hidden sm:inline-flex">Esc</Chip>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {grouped.length === 0 ? (
                <div className="p-6 text-sm text-zinc-600 dark:text-zinc-400">No results.</div>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{group}</div>
                    <div className="mt-2 space-y-1">
                      {items.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            a.run()
                            onClose()
                          }}
                          className="flex w-full items-center justify-between rounded-2xl border border-transparent px-3 py-2 text-left text-sm text-zinc-800 hover:border-zinc-200 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/40"
                        >
                          <div>
                            <div className="font-semibold">{a.name}</div>
                            {a.hint ? <div className="text-xs text-zinc-500 dark:text-zinc-400">{a.hint}</div> : null}
                          </div>
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Tip: Press <span className="font-semibold">Ctrl/⌘ + K</span> anytime.
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

// ---------------- Saved Views ----------------

type SavedView = {
  id: string
  name: string
  timeframe: "7" | "30" | "60"
  minPlays: number
  comparePrev: boolean
  metricView: "overview" | "mood" | "plays" | "relationships"
  theme: ThemeMode
}

const VIEWS_KEY = "smoodify_saved_views"

function loadViews(): SavedView[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(VIEWS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveViews(views: SavedView[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(VIEWS_KEY, JSON.stringify(views))
}

// ---------------- Widgets ----------------

function MetricCard({
  label,
  value,
  icon,
  hint,
  footer,
  accent = "emerald",
}: {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  hint?: React.ReactNode
  footer?: React.ReactNode
  accent?: "emerald" | "blue" | "rose" | "violet" | "amber"
}) {
  const ring =
    accent === "emerald"
      ? "from-emerald-500/12 dark:from-emerald-500/10"
      : accent === "blue"
      ? "from-sky-500/12 dark:from-sky-500/10"
      : accent === "rose"
      ? "from-rose-500/12 dark:from-rose-500/10"
      : accent === "violet"
      ? "from-violet-500/12 dark:from-violet-500/10"
      : "from-amber-500/12 dark:from-amber-500/10"

  const iconBg =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
      : accent === "blue"
      ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20"
      : accent === "rose"
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
      : accent === "violet"
      ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20"
      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className={cn("absolute inset-0 bg-gradient-to-b to-transparent", ring)} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</div>
          {hint ? <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div> : null}
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-2xl border", iconBg)}>{icon}</div>
      </div>
      {footer ? <div className="relative mt-4">{footer}</div> : null}
    </div>
  )
}

function QuickHighlight({
  icon,
  title,
  sub,
  value,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  sub?: string
  value: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/40",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
          {sub ? <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div> : null}
        </div>
      </div>
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
    </button>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
        <div className="text-zinc-900 dark:text-zinc-100">{icon}</div>
      </div>
      <div className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  )
}

function DailyTable({ rows, onPick }: { rows: Array<any>; onPick: (day: string) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
      <div className="grid grid-cols-12 gap-2 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
        <div className="col-span-4">Day</div>
        <div className="col-span-3">Valence</div>
        <div className="col-span-3">Energy</div>
        <div className="col-span-2 text-right">Plays</div>
      </div>

      <div className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950/30">
        {rows
          .slice()
          .reverse()
          .slice(0, 18)
          .map((r) => (
            <button
              key={r.day}
              type="button"
              onClick={() => onPick(r.day)}
              className="grid w-full grid-cols-12 gap-2 px-4 py-3 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
            >
              <div className="col-span-4 font-semibold text-zinc-900 dark:text-zinc-100">{niceDateLabel(r.day)}</div>
              <div className="col-span-3 text-zinc-700 dark:text-zinc-300">{fmt01(r.avg_valence)}</div>
              <div className="col-span-3 text-zinc-700 dark:text-zinc-300">{fmt01(r.avg_energy)}</div>
              <div className="col-span-2 text-right font-semibold text-zinc-900 dark:text-zinc-100">{fmtInt(r.events_count)}</div>
            </button>
          ))}
      </div>
    </div>
  )
}

function MoodHistogram({ points }: { points: Array<{ avg_valence: number | null }> }) {
  const bins = useMemo(() => {
    const counts = Array.from({ length: 10 }, () => 0)
    for (const p of points) {
      if (p.avg_valence === null) continue
      const idx = Math.min(9, Math.max(0, Math.floor(p.avg_valence * 10)))
      counts[idx] += 1
    }
    return counts.map((c, i) => ({
      bin: `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`,
      count: c,
    }))
  }, [points])

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={bins} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="bin" stroke="#71717a" tick={{ fill: "#71717a", fontSize: 11 }} interval={1} />
          <YAxis stroke="#71717a" tick={{ fill: "#71717a" }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Days" fill="#10b981" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Heatmap({ points }: { points: Array<{ day: string; avg_valence: number | null; avg_energy: number | null }> }) {
  const cells = useMemo(() => {
    const last = [...points].slice(-28)
    return last.map((p) => {
      const score = p.avg_valence ?? p.avg_energy ?? null
      if (score === null) return { day: p.day, score, bg: "rgba(113,113,122,0.15)", border: "rgba(113,113,122,0.25)" }
      const intensity = clamp01(score)
      const hue = 160 + (1 - intensity) * 60
      const saturation = 55 + intensity * 25
      const light = 28 + intensity * 34
      const bg = `hsl(${hue} ${saturation}% ${light}%)`
      const border = `hsl(${hue} ${saturation}% ${Math.min(80, light + 10)}%)`
      return { day: p.day, score, bg, border }
    })
  }, [points])

  if (!cells.length) return null

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Consistency map</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Last 28 days • brighter = higher mood</div>
        </div>
        <Chip>
          <CalendarDays className="h-3.5 w-3.5" /> 28d
        </Chip>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {cells.map((c, i) => (
          <div
            key={`${c.day}-${i}`}
            className="group relative rounded-xl border shadow-sm transition-transform hover:scale-110 hover:z-10"
            style={{
              backgroundColor: c.bg,
              borderColor: c.border,
              aspectRatio: "1 / 1",
              minHeight: 28,
            }}
            title={`${niceDateLabel(c.day)} • ${c.score === null ? "—" : clamp01(c.score).toFixed(2)}`}
          />
        ))}
      </div>

      <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Uses valence when available (falls back to energy).
      </div>
    </div>
  )
}

function PatternListPro({ items }: { items: Array<any> }) {
  const [openKey, setOpenKey] = useState<string | null>(null)

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No patterns yet</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Once enough data exists per weekday/time bucket, patterns will appear here.
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {items.slice(0, 12).map((p: any, idx: number) => {
        const key = `${String(p.id ?? p.pattern_key ?? "p")}-${idx}`
        const isOpen = openKey === key

        const impact = typeof p.__impact === "number" ? p.__impact : 0
        const positive = impact >= 0
        const badge = positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"

        const conf = typeof p.__c === "number" ? clamp01(p.__c) : null

        return (
          <motion.div
            key={key}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40"
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 text-left"
              onClick={() => setOpenKey(isOpen ? null : key)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", badge)}>
                    {positive ? "Boost" : "Dip"}
                  </span>
                </div>

                {p.summary ? <div className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">{p.summary}</div> : null}

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Chip>
                    <Zap className="h-3.5 w-3.5" /> Energy{" "}
                    {p.__e === undefined || p.__e === null ? "—" : clamp01(p.__e).toFixed(2)}
                  </Chip>
                  <Chip>
                    <Heart className="h-3.5 w-3.5" /> Valence{" "}
                    {p.__v === undefined || p.__v === null ? "—" : clamp01(p.__v).toFixed(2)}
                  </Chip>
                  <Chip>
                    <Activity className="h-3.5 w-3.5" /> Impact{" "}
                    <span className={cn("font-semibold", positive ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
                      {impact >= 0 ? "+" : ""}
                      {(impact * 100).toFixed(0)}%
                    </span>
                  </Chip>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <Separator className="my-4" />
                  <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">Explainability</div>
                      <div className="mt-1">
                        This pattern is derived from repeated context buckets (weekday/time). Repeat it for 5–7 days to validate it.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">Confidence</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{conf === null ? "—" : `${Math.round(conf * 100)}%`}</div>
                      </div>
                      <div className="mt-2">
                        <Progress value={conf === null ? 0 : conf * 100} />
                      </div>
                      <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        (If you provide confidence from the backend, this becomes real.)
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">Experiment</div>
                      <div className="mt-1">
                        Change only one variable (time, playlist intensity, or volume). Keep the rest constant to isolate what affects you.
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

// ---------------- Main ----------------

export default function Dashboard() {
  const page = usePage()
  const { stats, dailySeries, patterns, user, rangeLabel } = (page.props as any) as Props

  const reduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // ✅ Theme (default dark)
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme())
  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Controls
  const [timeframe, setTimeframe] = useState<"7" | "30" | "60">("30")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [comparePrev, setComparePrev] = useState(true)
  const [minPlays, setMinPlays] = useState(0)
  const [metricView, setMetricView] = useState<"overview" | "mood" | "plays" | "relationships">("overview")

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(new Date())

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 180)

  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false)

  // Drill-down
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Command Palette (MORE POWERRRR)
  const [cmdOpen, setCmdOpen] = useState(false)

  // Saved views (MORE POWER)
  const [views, setViews] = useState<SavedView[]>(() => loadViews())

  // Hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k"
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault()
        setCmdOpen(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault()
        refresh()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const greetingName = user?.name ? user.name.split(" ")[0] : "there"

  const refresh = () => {
    setIsRefreshing(true)
    router.reload({
      preserveScroll: true,
      preserveState: true,
      onFinish: () => {
        setIsRefreshing(false)
        setLastUpdatedAt(new Date())
      },
    })
  }

  const generateDemoData = () => {
    setIsGeneratingDemo(true)
    router.post(
      "/demo-data/generate",
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => {
          setIsGeneratingDemo(false)
          setLastUpdatedAt(new Date())
          router.reload({ preserveScroll: true, preserveState: true })
        },
      }
    )
  }

  // Normalize
  const normalized = useMemo(() => {
    const sorted = (dailySeries || [])
      .map((d) => {
        const v = toNum((d as any).avg_valence)
        const e = toNum((d as any).avg_energy)
        const plays = toInt((d as any).events_count)
        const day = String((d as any).day || "")
        return {
          day,
          avg_valence: v === null ? null : clamp01(v),
          avg_energy: e === null ? null : clamp01(e),
          events_count: plays,
        }
      })
      .filter((d) => d.day)
      .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0))

    return sorted
  }, [dailySeries])

  const windowSize = timeframe === "7" ? 7 : timeframe === "30" ? 30 : 60

  const chartData = useMemo(() => {
    const slice = normalized.slice(-Math.min(windowSize, normalized.length))
    return slice.filter((d) => (d.events_count ?? 0) >= minPlays)
  }, [normalized, windowSize, minPlays])

  const prevWindow = useMemo(() => {
    if (!comparePrev) return []
    const end = Math.max(0, normalized.length - windowSize)
    const start = Math.max(0, end - windowSize)
    return normalized.slice(start, end)
  }, [comparePrev, normalized, windowSize])

  const hasData = chartData.length > 0
  const hasMoodData = useMemo(
    () => chartData.some((p) => p.avg_valence !== null || p.avg_energy !== null),
    [chartData]
  )
  const hasPlayData = useMemo(() => chartData.some((p) => (p.events_count ?? 0) > 0), [chartData])

  // Auto polling
  useEffect(() => {
    if (!autoRefresh) return
    const fastMs = 3000
    const slowMs = 10000
    const ms = hasData ? slowMs : fastMs

    const id = setInterval(() => {
      router.reload({
        preserveScroll: true,
        preserveState: true,
        onFinish: () => setLastUpdatedAt(new Date()),
      })
    }, ms)

    return () => clearInterval(id)
  }, [autoRefresh, hasData])

  const computed = useMemo(() => {
    const points = chartData

    const vals = points.map((p) => p.avg_valence).filter((v): v is number => v !== null && Number.isFinite(v))
    const engs = points.map((p) => p.avg_energy).filter((v): v is number => v !== null && Number.isFinite(v))
    const plays = points.map((p) => p.events_count ?? 0)

    const valMean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    const engMean = engs.length ? engs.reduce((a, b) => a + b, 0) / engs.length : null
    const playsMean = plays.length ? plays.reduce((a, b) => a + b, 0) / plays.length : null

    const vP90 = vals.length ? percentile(vals, 0.9) : null
    const vP10 = vals.length ? percentile(vals, 0.1) : null
    const eP90 = engs.length ? percentile(engs, 0.9) : null

    const best = [...points]
      .filter((p) => p.avg_valence !== null || p.avg_energy !== null)
      .sort((a, b) => (b.avg_valence ?? b.avg_energy ?? -1) - (a.avg_valence ?? a.avg_energy ?? -1))[0]

    const worst = [...points]
      .filter((p) => p.avg_valence !== null || p.avg_energy !== null)
      .sort((a, b) => (a.avg_valence ?? a.avg_energy ?? 2) - (b.avg_valence ?? b.avg_energy ?? 2))[0]

    const mostPlays = [...points].sort((a, b) => (b.events_count ?? 0) - (a.events_count ?? 0))[0]

    const paired = points
      .filter((p) => p.avg_energy !== null && p.avg_valence !== null)
      .map((p) => ({ v: p.avg_valence as number, e: p.avg_energy as number }))

    const corr = pearson(
      paired.map((x) => x.v),
      paired.map((x) => x.e)
    )

    const byDow = new Map<string, { sum: number; n: number }>()
    for (const p of points) {
      const d = parseISO(p.day)
      if (!d) continue
      const score = p.avg_valence ?? p.avg_energy
      if (score === null || !Number.isFinite(score)) continue
      const k = weekdayShort(d)
      const cur = byDow.get(k) ?? { sum: 0, n: 0 }
      cur.sum += score
      cur.n += 1
      byDow.set(k, cur)
    }
    const bestDow = [...byDow.entries()]
      .map(([k, v]) => ({ k, avg: v.sum / Math.max(1, v.n) }))
      .sort((a, b) => b.avg - a.avg)[0]

    const totalDays = points.length
    const moodDays = points.filter((p) => p.avg_valence !== null || p.avg_energy !== null).length
    const coverage = totalDays ? Math.round((moodDays / totalDays) * 100) : 0

    const vMA = movingAverage(points.map((p) => p.avg_valence), 7)
    const eMA = movingAverage(points.map((p) => p.avg_energy), 7)
    const pMA = movingAverage(points.map((p) => (p.events_count ?? 0) as any), 7)

    const prevVals = prevWindow.map((p) => p.avg_valence).filter((v): v is number => v !== null && Number.isFinite(v))
    const prevEngs = prevWindow.map((p) => p.avg_energy).filter((v): v is number => v !== null && Number.isFinite(v))
    const prevPlays = prevWindow.map((p) => p.events_count ?? 0)

    const prevValMean = prevVals.length ? prevVals.reduce((a, b) => a + b, 0) / prevVals.length : null
    const prevEngMean = prevEngs.length ? prevEngs.reduce((a, b) => a + b, 0) / prevEngs.length : null
    const prevPlaysMean = prevPlays.length ? prevPlays.reduce((a, b) => a + b, 0) / prevPlays.length : null

    const delta = (cur: number | null, prev: number | null) => {
      if (cur === null || prev === null || prev === 0) return null
      return ((cur - prev) / prev) * 100
    }

    return {
      valMean,
      engMean,
      playsMean,
      vP90,
      vP10,
      eP90,
      best,
      worst,
      mostPlays,
      corr,
      bestDow,
      coverage,
      vMA,
      eMA,
      pMA,
      prevValMean,
      prevEngMean,
      prevPlaysMean,
      valDeltaPct: delta(valMean, prevValMean),
      engDeltaPct: delta(engMean, prevEngMean),
      playsDeltaPct: delta(playsMean, prevPlaysMean),
    }
  }, [chartData, prevWindow])

  // Pattern scoring + sorting
  const [patternSort, setPatternSort] = useState<"impact" | "valence" | "energy" | "confidence">("impact")

  const patternList = useMemo(() => {
    const list = (patterns || []).map((p) => {
      const v = p.meta?.avg_valence ?? null
      const e = p.meta?.avg_energy ?? null
      const c = p.meta?.confidence ?? null
      const impact =
        p.meta?.impact ??
        (v !== null && e !== null ? (v + e) / 2 - 0.5 : v ?? e ?? 0) // heuristic
      return { ...p, __v: v, __e: e, __c: c, __impact: impact }
    })

    const q = debouncedSearch.trim().toLowerCase()
    const filtered = q
      ? list.filter((p) => `${p.title} ${p.summary ?? ""}`.toLowerCase().includes(q))
      : list

    const sorted = [...filtered].sort((a: any, b: any) => {
      if (patternSort === "valence") return (b.__v ?? -999) - (a.__v ?? -999)
      if (patternSort === "energy") return (b.__e ?? -999) - (a.__e ?? -999)
      if (patternSort === "confidence") return (b.__c ?? -999) - (a.__c ?? -999)
      return (b.__impact ?? -999) - (a.__impact ?? -999)
    })

    return sorted
  }, [patterns, debouncedSearch, patternSort])

  const headerRangeLabel =
    rangeLabel || (timeframe === "7" ? "Last 7 days" : timeframe === "30" ? "Last 30 days" : "Last 60 days")

  // Theme-aware chart colors
  const chartGrid = theme === "dark" ? "#27272a" : "#e4e4e7"
  const axis = theme === "dark" ? "#a1a1aa" : "#71717a"

  // CSV export
  const exportCSV = () => {
    const rows = [
      ["day", "avg_valence", "avg_energy", "events_count"],
      ...chartData.map((d) => [d.day, d.avg_valence ?? "", d.avg_energy ?? "", d.events_count ?? 0]),
    ]
    const csv = rows.map((r) => r.map((x) => `${x}`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `smoodify_${timeframe}d.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const share = async () => {
    const text = `Smoodify Dashboard — ${headerRangeLabel}`
    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: "Smoodify", text })
      } else {
        await navigator.clipboard.writeText(text)
      }
    } catch {
      // ignore
    }
  }

  const dayDetails = useMemo(() => {
    if (!selectedDay) return null
    return chartData.find((d) => d.day === selectedDay) ?? null
  }, [selectedDay, chartData])

  // Saved views
  const saveCurrentView = () => {
    const name = window.prompt("Name this view (e.g., “Deep work week”, “Chill nights”)")
    if (!name) return
    const v: SavedView = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name,
      timeframe,
      minPlays,
      comparePrev,
      metricView,
      theme,
    }
    const next = [v, ...views].slice(0, 12)
    setViews(next)
    saveViews(next)
  }

  const applyView = (v: SavedView) => {
    setTimeframe(v.timeframe)
    setMinPlays(v.minPlays)
    setComparePrev(v.comparePrev)
    setMetricView(v.metricView)
    setTheme(v.theme)
  }

  const deleteView = (id: string) => {
    const next = views.filter((v) => v.id !== id)
    setViews(next)
    saveViews(next)
  }

  // Command palette actions
  const cmdActions: CmdAction[] = useMemo(
    () => [
      { id: "refresh", name: "Refresh", hint: "Reload dashboard data", group: "General", run: refresh },
      {
        id: "toggleLive",
        name: autoRefresh ? "Pause live" : "Resume live",
        hint: "Toggle auto refresh polling",
        group: "General",
        run: () => setAutoRefresh((v) => !v),
      },
      { id: "export", name: "Export CSV", hint: "Download current window", group: "Data", run: exportCSV },
      { id: "share", name: "Share", hint: "Share/copy dashboard title", group: "Data", run: share },
      {
        id: "theme",
        name: theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode",
        hint: "Toggle theme (default dark)",
        group: "Theme",
        run: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      },
      { id: "view_overview", name: "Go to Overview", group: "Navigate", run: () => setMetricView("overview") },
      { id: "view_mood", name: "Go to Mood", group: "Navigate", run: () => setMetricView("mood") },
      { id: "view_plays", name: "Go to Plays", group: "Navigate", run: () => setMetricView("plays") },
      { id: "view_rel", name: "Go to Relationships", group: "Navigate", run: () => setMetricView("relationships") },
      { id: "tf_7", name: "Set window: 7 days", group: "Window", run: () => setTimeframe("7") },
      { id: "tf_30", name: "Set window: 30 days", group: "Window", run: () => setTimeframe("30") },
      { id: "tf_60", name: "Set window: 60 days", group: "Window", run: () => setTimeframe("60") },
      { id: "mp_0", name: "Min plays/day: 0", group: "Filters", run: () => setMinPlays(0) },
      { id: "mp_5", name: "Min plays/day: 5", group: "Filters", run: () => setMinPlays(5) },
      { id: "mp_10", name: "Min plays/day: 10", group: "Filters", run: () => setMinPlays(10) },
      { id: "mp_25", name: "Min plays/day: 25", group: "Filters", run: () => setMinPlays(25) },
      {
        id: "compare",
        name: comparePrev ? "Disable compare window" : "Enable compare window",
        hint: "Compare current window to previous",
        group: "Window",
        run: () => setComparePrev((v) => !v),
      },
      { id: "save_view", name: "Save current view", hint: "Store filters + theme", group: "Saved", run: saveCurrentView },
      { id: "demo", name: "Generate demo data", hint: "Seed the dataset", group: "Dev", run: generateDemoData },
    ],
    [autoRefresh, comparePrev, theme, timeframe, minPlays, views]
  )

  // Top-level wrapper label
  const header = `Smoodify • ${headerRangeLabel}`

  return (
    <>
      <Head title="Dashboard" />
      <AmbientBg />

      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {/* Top bar */}
        <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/75 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={reduceMotion ? false : { scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30"
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold tracking-tight">Smoodify</div>
                  <Badge variant="secondary" className="rounded-full">
                    {headerRangeLabel}
                  </Badge>
                  <Chip>
                    <Activity className="h-3.5 w-3.5" />
                    <span className="text-zinc-600 dark:text-zinc-300">{autoRefresh ? "Live" : "Paused"}</span>
                  </Chip>
                </div>
                <div className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Hi {greetingName} — mood, energy, and listening patterns with real context.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastUpdatedAt ? (
                <Chip className="hidden md:inline-flex">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {lastUpdatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </Chip>
              ) : null}

              <Button variant="outline" className="rounded-2xl hidden md:inline-flex" onClick={() => setCmdOpen(true)}>
                <CommandIcon className="mr-2 h-4 w-4" />
                Command
                <span className="ml-2 hidden lg:inline text-xs text-zinc-500 dark:text-zinc-400">Ctrl/⌘K</span>
              </Button>

              <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Dark mode</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-2xl">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Controls
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-[320px]">
                  <DropdownMenuLabel>Window</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 pb-2 pt-1 flex gap-2">
                    <Button
                      variant={timeframe === "7" ? "default" : "secondary"}
                      className="rounded-2xl w-full"
                      onClick={() => setTimeframe("7")}
                    >
                      7d
                    </Button>
                    <Button
                      variant={timeframe === "30" ? "default" : "secondary"}
                      className="rounded-2xl w-full"
                      onClick={() => setTimeframe("30")}
                    >
                      30d
                    </Button>
                    <Button
                      variant={timeframe === "60" ? "default" : "secondary"}
                      className="rounded-2xl w-full"
                      onClick={() => setTimeframe("60")}
                    >
                      60d
                    </Button>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Compare</DropdownMenuLabel>
                  <div className="flex items-center justify-between px-2 py-2">
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">Compare to previous window</div>
                    <Switch checked={comparePrev} onCheckedChange={(v) => setComparePrev(Boolean(v))} />
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filters</DropdownMenuLabel>
                  <div className="px-2 pb-2">
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">Minimum plays/day</div>
                    <div className="mt-2 flex gap-2">
                      {[0, 5, 10, 25].map((n) => (
                        <Button
                          key={n}
                          variant={minPlays === n ? "default" : "secondary"}
                          className="rounded-2xl"
                          onClick={() => setMinPlays(n)}
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <div className="flex items-center justify-between px-2 py-2">
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">Dark mode (default)</div>
                    <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Saved views</DropdownMenuLabel>
                  <div className="px-2 pb-2">
                    <Button variant="secondary" className="rounded-2xl w-full" onClick={saveCurrentView}>
                      Save current view
                    </Button>
                    {views.length ? (
                      <div className="mt-2 space-y-1">
                        {views.slice(0, 6).map((v) => (
                          <div key={v.id} className="flex items-center gap-2">
                            <button
                              type="button"
                              className="flex-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100 dark:hover:bg-zinc-900/40"
                              onClick={() => applyView(v)}
                              title="Load view"
                            >
                              {v.name}
                              <div className="mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                {v.timeframe}d • min {v.minPlays} • {v.metricView} • {v.theme}
                              </div>
                            </button>
                            <Button variant="outline" className="rounded-2xl" onClick={() => deleteView(v.id)}>
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Save a view to quickly return to your favorite settings.
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={exportCSV} className="rounded-2xl hidden md:inline-flex">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <Button variant="outline" onClick={share} className="rounded-2xl hidden md:inline-flex">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>

              <Button
                variant="secondary"
                onClick={generateDemoData}
                className="rounded-2xl"
                disabled={isGeneratingDemo}
              >
                <Sparkles className={cn("mr-2 h-4 w-4", isGeneratingDemo && "animate-pulse")} />
                {isGeneratingDemo ? "Generating…" : "Demo data"}
              </Button>

              <Button onClick={refresh} className="rounded-2xl" disabled={isRefreshing}>
                <RefreshCcw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard
                  accent="emerald"
                  label="Avg valence"
                  value={<AnimatedStat value={computed.valMean ?? stats?.avgValence ?? null} format={(n) => clamp01(n).toFixed(2)} />}
                  hint={
                    <div className="flex items-center gap-2">
                      <span>0 low • 1 high</span>
                      <TrendBadge pct={computed.valDeltaPct ?? stats?.valenceTrendPct} />
                    </div>
                  }
                  icon={<Heart className="h-5 w-5" />}
                  footer={
                    <div>
                      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                        <span>p10</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{fmt01(computed.vP10)}</span>
                      </div>
                      <Progress value={Number.isFinite(computed.vP10 as any) ? clamp01(computed.vP10 as number) * 100 : 0} />
                    </div>
                  }
                />

                <MetricCard
                  accent="blue"
                  label="Avg energy"
                  value={<AnimatedStat value={computed.engMean ?? stats?.avgEnergy ?? null} format={(n) => clamp01(n).toFixed(2)} />}
                  hint={
                    <div className="flex items-center gap-2">
                      <span>0 calm • 1 intense</span>
                      <TrendBadge pct={computed.engDeltaPct ?? stats?.energyTrendPct} />
                    </div>
                  }
                  icon={<Zap className="h-5 w-5" />}
                  footer={
                    <div>
                      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                        <span>p90</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{fmt01(computed.eP90)}</span>
                      </div>
                      <Progress value={Number.isFinite(computed.eP90 as any) ? clamp01(computed.eP90 as number) * 100 : 0} />
                    </div>
                  }
                />

                <MetricCard
                  accent="violet"
                  label="Avg plays/day"
                  value={computed.playsMean === null ? "—" : Math.round(computed.playsMean).toLocaleString()}
                  hint={
                    <div className="flex items-center gap-2">
                      <span>listening volume</span>
                      <TrendBadge pct={computed.playsDeltaPct ?? undefined} />
                    </div>
                  }
                  icon={<Music className="h-5 w-5" />}
                  footer={
                    <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                      <span>total plays</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{fmtInt(stats?.eventsCount ?? null)}</span>
                    </div>
                  }
                />
              </div>
            </div>

            <div className="lg:col-span-4">
              <Card className="rounded-3xl overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Data quality</CardTitle>
                  <CardDescription>How reliable is this window?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mood coverage</div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{computed.coverage}%</div>
                  </div>
                  <Progress value={computed.coverage} />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Days analyzed</div>
                      <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {fmtInt(stats?.daysCount ?? chartData.length)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Streak</div>
                      <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <Flame className="h-5 w-5 text-amber-500" />
                        {fmtInt(stats?.streakDays ?? null)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
                    Power tips: Use <span className="font-semibold text-zinc-900 dark:text-zinc-100">min plays/day</span> to remove noisy days. Use{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">compare</span> to validate improvements.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <Tabs value={metricView} onValueChange={(v: any) => setMetricView(v)} className="w-full">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="mood">Mood</TabsTrigger>
                  <TabsTrigger value="plays">Plays</TabsTrigger>
                  <TabsTrigger value="relationships">Relationships</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Chip className="hidden md:inline-flex">
                    <ListFilter className="h-3.5 w-3.5" />
                    min plays: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{minPlays}</span>
                  </Chip>

                  <Button variant="outline" className="rounded-2xl" onClick={() => setAutoRefresh((v) => !v)}>
                    {autoRefresh ? "Pause live" : "Resume live"}
                  </Button>
                </div>
              </div>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Mood trend */}
                  <Card className="rounded-3xl lg:col-span-8 overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">Mood trend</CardTitle>
                          <CardDescription>Valence & energy by day (with MA7 smoothing). Click points to drill down.</CardDescription>
                        </div>
                        <Chip>
                          <LineChart className="h-3.5 w-3.5" /> Daily
                        </Chip>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!hasData ? (
                        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Waiting for results…</div>
                          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                            If you just generated demo data, analysis may still be running. This page will refresh automatically.
                          </div>
                          <div className="mt-6 grid gap-3">
                            <Skeleton className="h-8 w-2/3" />
                            <Skeleton className="h-56 w-full" />
                          </div>
                        </div>
                      ) : !mounted ? (
                        <Skeleton className="h-[360px] w-full" />
                      ) : !hasMoodData ? (
                        <div className="grid h-[360px] place-items-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No mood aggregates yet</div>
                            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                              avg_valence / avg_energy are missing in this window.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[360px]">
                          <ResponsiveContainer width="100%" height={360}>
                            <AreaChart
                              data={chartData.map((d, i) => ({
                                ...d,
                                v_ma7: computed.vMA[i],
                                e_ma7: computed.eMA[i],
                              }))}
                              margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="vFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                                  <stop offset="90%" stopColor="#10b981" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="eFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.20} />
                                  <stop offset="90%" stopColor="#38bdf8" stopOpacity={0.02} />
                                </linearGradient>
                              </defs>

                              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                              <XAxis dataKey="day" tickFormatter={niceDateLabel} stroke={axis} tick={{ fill: axis }} />
                              <YAxis domain={[0, 1]} stroke={axis} tick={{ fill: axis }} />
                              <Tooltip content={<TooltipCard />} />
                              <Legend />

                              <Area
                                type="monotone"
                                dataKey="avg_valence"
                                name="Valence"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#vFill)"
                                connectNulls={false}
                                dot={{ r: 2 }}
                                activeDot={{
                                  r: 5,
                                  onClick: (_: any, payload: any) => setSelectedDay(payload?.payload?.day ?? null),
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="avg_energy"
                                name="Energy"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                fill="url(#eFill)"
                                connectNulls={false}
                                dot={{ r: 2 }}
                                activeDot={{
                                  r: 5,
                                  onClick: (_: any, payload: any) => setSelectedDay(payload?.payload?.day ?? null),
                                }}
                              />

                              <Line type="monotone" dataKey="v_ma7" name="Valence (MA7)" stroke="#065f46" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="e_ma7" name="Energy (MA7)" stroke="#0369a1" strokeWidth={2} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {hasData ? (
                        <>
                          <Separator className="my-5" />
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <QuickHighlight
                              icon={<Sparkles className="h-5 w-5" />}
                              title="Best day"
                              sub={computed.best?.day ? niceDateLabel(computed.best.day) : "—"}
                              value={computed.best ? fmt01(computed.best.avg_valence ?? computed.best.avg_energy ?? null) : "—"}
                              onClick={() => computed.best?.day && setSelectedDay(computed.best.day)}
                            />
                            <QuickHighlight
                              icon={<TrendingDown className="h-5 w-5" />}
                              title="Toughest day"
                              sub={computed.worst?.day ? niceDateLabel(computed.worst.day) : "—"}
                              value={computed.worst ? fmt01(computed.worst.avg_valence ?? computed.worst.avg_energy ?? null) : "—"}
                              onClick={() => computed.worst?.day && setSelectedDay(computed.worst.day)}
                            />
                            <QuickHighlight
                              icon={<CalendarDays className="h-5 w-5" />}
                              title="Best weekday"
                              sub="Avg score"
                              value={computed.bestDow ? `${computed.bestDow.k} • ${clamp01(computed.bestDow.avg).toFixed(2)}` : "—"}
                            />
                          </div>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>

                  {/* Plays trend */}
                  <Card className="rounded-3xl lg:col-span-4 overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">Plays volume</CardTitle>
                          <CardDescription>Daily plays + MA7.</CardDescription>
                        </div>
                        <Chip>
                          <BarChart3 className="h-3.5 w-3.5" /> Volume
                        </Chip>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!mounted ? (
                        <Skeleton className="h-[360px] w-full" />
                      ) : !hasPlayData ? (
                        <div className="grid h-[360px] place-items-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No play data</div>
                            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">events_count is 0 in this window.</div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[360px]">
                          <ResponsiveContainer width="100%" height={360}>
                            <BarChart
                              data={chartData.map((d, i) => ({
                                ...d,
                                p_ma7: computed.pMA[i] as any,
                              }))}
                              margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                              <XAxis dataKey="day" tickFormatter={niceDateLabel} stroke={axis} tick={{ fill: axis }} />
                              <YAxis stroke={axis} tick={{ fill: axis }} />
                              <Tooltip content={<TooltipCard />} />
                              <Legend />
                              <Bar dataKey="events_count" name="Plays" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                              <Line type="monotone" dataKey="p_ma7" name="Plays (MA7)" stroke="#6d28d9" strokeWidth={2} dot={false} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <Separator className="my-5" />
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">Actionable insight</div>
                        <div className="mt-1">
                          If mood dips on high-play days, try one “baseline” playlist for a week—makes patterns easier to trust.
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Heatmap */}
                  <div className="lg:col-span-12">{mounted && hasData ? <Heatmap points={chartData} /> : null}</div>

                  {/* Patterns */}
                  <Card className="rounded-3xl lg:col-span-12 border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <CardTitle className="text-base">Patterns</CardTitle>
                          <CardDescription>Explainable insights from your listening habits (now with impact + confidence UI).</CardDescription>
                        </div>

                        <div className="flex w-full flex-col gap-2 md:w-[560px] md:flex-row md:items-center md:justify-end">
                          <div className="relative w-full">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              placeholder="Search patterns…"
                              className="pl-9 rounded-2xl"
                            />
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="rounded-2xl">
                                <ListFilter className="mr-2 h-4 w-4" />
                                Sort
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setPatternSort("impact")}>Impact</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPatternSort("valence")}>Valence</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPatternSort("energy")}>Energy</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPatternSort("confidence")}>Confidence</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <PatternListPro items={patternList} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="mood" className="mt-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <Card className="rounded-3xl lg:col-span-8 border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Valence distribution</CardTitle>
                      <CardDescription>Quick histogram for where mood tends to land.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!mounted || !hasMoodData ? (
                        <div className="grid h-[340px] place-items-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Not enough mood data</div>
                            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Add more days or widen the window.</div>
                          </div>
                        </div>
                      ) : (
                        <MoodHistogram points={chartData} />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl lg:col-span-4 border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Mood summary</CardTitle>
                      <CardDescription>Read this like a coach.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Stability</div>
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                          Large p90–p10 gap means bigger swings. Use routines (same time, same playlist energy) to isolate causes.
                        </div>
                      </div>

                      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Targets (power mode)</div>
                        <div className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                          <div className="flex items-center justify-between">
                            <span>Coverage goal</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{computed.coverage}% / 80%</span>
                          </div>
                          <Progress value={Math.min(100, (computed.coverage / 80) * 100)} />
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            (Set goals in backend later — UI already supports it.)
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="plays" className="mt-6">
                <Card className="rounded-3xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Daily table</CardTitle>
                    <CardDescription>Click a day for the drill-down drawer.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!hasData ? (
                      <div className="grid h-[280px] place-items-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No data</div>
                          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Generate demo data or widen the range.</div>
                        </div>
                      </div>
                    ) : (
                      <DailyTable rows={chartData} onPick={(day) => setSelectedDay(day)} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="relationships" className="mt-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <Card className="rounded-3xl lg:col-span-8 border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Energy ↔ Valence</CardTitle>
                      <CardDescription>Scatter across days. Click a dot to drill down.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!mounted || !hasMoodData ? (
                        <div className="grid h-[360px] place-items-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Not enough paired data</div>
                            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                              Need both avg_valence and avg_energy on multiple days.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[360px]">
                          <ResponsiveContainer width="100%" height={360}>
                            <ScatterChart margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                              <XAxis type="number" dataKey="avg_energy" domain={[0, 1]} stroke={axis} tick={{ fill: axis }} name="Energy" />
                              <YAxis type="number" dataKey="avg_valence" domain={[0, 1]} stroke={axis} tick={{ fill: axis }} name="Valence" />
                              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                              <ReferenceLine x={0.5} stroke={chartGrid} />
                              <ReferenceLine y={0.5} stroke={chartGrid} />
                              <Scatter
                                data={chartData.filter((p) => p.avg_energy !== null && p.avg_valence !== null)}
                                fill="#0ea5e9"
                                onClick={(p: any) => setSelectedDay(p?.day ?? null)}
                              />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl lg:col-span-4 border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Correlation</CardTitle>
                      <CardDescription>Simple Pearson correlation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">Energy ↔ Valence</div>
                        <div className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                          {computed.corr === null ? "—" : computed.corr.toFixed(2)}
                        </div>
                        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          {computed.corr === null
                            ? "Not enough paired days."
                            : computed.corr > 0.35
                            ? "On energetic days, you also tend to feel better."
                            : computed.corr < -0.35
                            ? "Higher energy days might be stressful here."
                            : "Energy and mood are only weakly linked in this window."}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">Next experiment</div>
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                          Try one variable: (1) calmer playlist at night, (2) higher BPM during workouts, (3) fixed “baseline” playlist for work.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">POWER shortcuts</div>
            <ul className="mt-2 grid gap-1.5 md:grid-cols-2">
              <li>• Ctrl/⌘ K: Command palette</li>
              <li>• Ctrl/⌘ R: Refresh</li>
              <li>• Click chart points: Day drill-down</li>
              <li>• Save views: your favorite presets</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Day drawer */}
      <Drawer
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Day details • ${niceDateLabel(selectedDay)}` : "Day details"}
      >
        {!dayDetails ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-300">No details found.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Valence" value={fmt01(dayDetails.avg_valence)} icon={<Heart className="h-4 w-4" />} />
              <MiniStat label="Energy" value={fmt01(dayDetails.avg_energy)} icon={<Zap className="h-4 w-4" />} />
              <MiniStat label="Plays" value={fmtInt(dayDetails.events_count)} icon={<Music className="h-4 w-4" />} />
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">Journaling prompt (power)</div>
              <div className="mt-1">
                What changed today? Sleep, work pressure, social exposure, time of day, playlist intensity — write one sentence and you’ll see patterns faster.
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Next actions</div>
              <div className="mt-2 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
                  If this was a great day: repeat the same context for 5–7 days to validate it.
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
                  If mood dipped: try a “reset” playlist + reduce intensity late at night.
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Command palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} actions={cmdActions} />
    </>
  )
}
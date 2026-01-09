import React, { useEffect, useMemo, useRef, useState } from "react"
import { Head, router, usePage } from "@inertiajs/react"
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  LineChart,
  ListFilter,
  Music,
  RefreshCcw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
  }
}

type Stats = {
  daysCount?: number
  eventsCount?: number
  avgValence?: number
  avgEnergy?: number
  streakDays?: number
  valenceTrendPct?: number // +5.2 means up
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

// ---------------- UI bits ----------------

function GlowBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-200/70 to-transparent blur-3xl" />
      <div className="absolute -bottom-48 right-[-80px] h-[520px] w-[520px] rounded-full bg-gradient-to-t from-zinc-200/60 to-transparent blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(24,24,27,0.05)_1px,transparent_0)] [background-size:18px_18px]" />
    </div>
  )
}

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur",
        className
      )}
    >
      {children}
    </span>
  )
}

function TrendLine({ pct }: { pct?: number }) {
  const t = fmtPct(pct)
  if (!t) return <div className="h-5" />
  const UpDown = pct! >= 0 ? TrendingUp : TrendingDown
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-600">
      <UpDown className="h-4 w-4" />
      <span className="font-semibold text-zinc-900">{t}</span>
      <span className="text-zinc-500">vs previous</span>
    </div>
  )
}

function MetricPill({
  label,
  icon,
  value,
  hint,
}: {
  label: string
  icon: React.ReactNode
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800">
          {icon}
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-500">{label}</div>
          <div className="text-base font-semibold text-zinc-900">{value}</div>
        </div>
      </div>
      {hint ? <div className="hidden text-xs text-zinc-500 md:block">{hint}</div> : null}
    </div>
  )
}

function TooltipCard({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  const map = payload.reduce((acc: any, item: any) => {
    acc[item.dataKey] = item.value
    return acc
  }, {})

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur">
      <div className="text-sm font-semibold text-zinc-900">{niceDateLabel(label || "")}</div>
      <div className="mt-2 grid gap-1 text-sm text-zinc-700">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4" /> Valence
          </span>
          <span className="font-semibold text-zinc-900">{fmt01(toNum(map.avg_valence))}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Energy
          </span>
          <span className="font-semibold text-zinc-900">{fmt01(toNum(map.avg_energy))}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <Music className="h-4 w-4" /> Plays
          </span>
          <span className="font-semibold text-zinc-900">{fmtInt(toNum(map.events_count))}</span>
        </div>
      </div>
    </div>
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-zinc-100", className)} />
}

function AnimatedStat({ value, format }: { value: number | null | undefined; format: (n: number) => string }) {
  const v = useAnimatedNumber(value)
  return <>{format(v)}</>
}

function InsightRow({
  icon,
  title,
  value,
  sub,
}: {
  icon: React.ReactNode
  title: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          {sub ? <div className="mt-0.5 text-xs text-zinc-500">{sub}</div> : null}
        </div>
      </div>
      <div className="text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  )
}

function Heatmap({ points }: { points: Array<{ day: string; avg_valence: number | null; avg_energy: number | null }> }) {
  const cells = useMemo(() => {
    const last = [...points].slice(-28)
    return last.map((p) => {
      const score = p.avg_valence ?? p.avg_energy ?? null
      const light = score === null ? 95 : 92 - clamp01(score) * 22
      const bg = `hsl(240 5% ${light}%)`
      const border = score === null ? "rgba(24,24,27,0.10)" : "rgba(24,24,27,0.14)"
      return { day: p.day, score, bg, border }
    })
  }, [points])

  if (!cells.length) return null

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Consistency map</div>
          <div className="mt-1 text-xs text-zinc-500">Last 28 days • darker = higher mood</div>
        </div>
        <Chip>
          <CalendarDays className="h-3.5 w-3.5" /> 28d
        </Chip>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {cells.map((c, i) => (
          <div
            key={`${c.day}-${i}`}
            className="group relative rounded-xl border shadow-sm"
            style={{
              backgroundColor: c.bg,
              borderColor: c.border,
              aspectRatio: "1 / 1",
              minHeight: 28,
            }}
            title={`${niceDateLabel(c.day)} • ${c.score === null ? "—" : clamp01(c.score).toFixed(2)}`}
          >
            <div className="pointer-events-none absolute inset-x-0 -top-8 hidden justify-center group-hover:flex">
              <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 shadow">
                {niceDateLabel(c.day)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Chip className="bg-white">
          <Heart className="h-3.5 w-3.5" /> Valence
        </Chip>
        <Chip className="bg-white">
          <Zap className="h-3.5 w-3.5" /> Energy
        </Chip>
        <span>• uses valence when available</span>
      </div>
    </div>
  )
}

// ---------------- Main ----------------

export default function Dashboard() {
  const page = usePage()
  const { stats, dailySeries, patterns, user, rangeLabel } = (page.props as any) as Props

  const reduceMotion = useReducedMotion()

  // ✅ Strong client-only gate (prevents ResponsiveContainer measuring 0 in SSR/hydration edge cases)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(new Date())

  const [timeframe, setTimeframe] = useState<"7" | "30" | "60">("60")
  const [metricFocus, setMetricFocus] = useState<"mood" | "plays">("mood")

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 180)

  const greetingName = user?.name ? user.name.split(" ")[0] : "there"

  // ✅ HARD-SANITIZED + ALWAYS-SORTED chart data
  const chartData = useMemo(() => {
    const sorted = (dailySeries || [])
      .map((d) => {
        const v = toNum((d as any).avg_valence)
        const e = toNum((d as any).avg_energy)
        return {
          day: String((d as any).day || ""),
          avg_valence: v === null ? null : clamp01(v),
          avg_energy: e === null ? null : clamp01(e),
          events_count: toInt((d as any).events_count),
        }
      })
      .filter((d) => d.day)
      .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0))

    const lastN = timeframe === "7" ? 7 : timeframe === "30" ? 30 : 60
    return sorted.slice(-Math.min(lastN, sorted.length))
  }, [dailySeries, timeframe])

  const hasData = chartData.length > 0
  const hasMoodData = useMemo(
    () => chartData.some((p) => p.avg_valence !== null || p.avg_energy !== null),
    [chartData]
  )
  const hasPlayData = useMemo(() => chartData.some((p) => (p.events_count ?? 0) > 0), [chartData])

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
    const [isGeneratingDemo, setIsGeneratingDemo] = useState(false)

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
          // Optional: hard refresh props after generation finishes
          router.reload({ preserveScroll: true, preserveState: true })
        },
      }
    )
  }

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

  const patternList = useMemo(() => {
    const list = patterns || []
    if (!debouncedSearch.trim()) return list
    const q = debouncedSearch.toLowerCase()
    return list.filter((p) => `${p.title} ${p.summary ?? ""}`.toLowerCase().includes(q))
  }, [patterns, debouncedSearch])

  const insights = useMemo(() => {
    const points = chartData

    const vals = points.map((p) => p.avg_valence).filter((v): v is number => v !== null && Number.isFinite(v))
    const engs = points.map((p) => p.avg_energy).filter((v): v is number => v !== null && Number.isFinite(v))

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

    return { vP90, vP10, eP90, best, worst, mostPlays, corr, bestDow }
  }, [chartData])

  const headerRangeLabel =
    rangeLabel || (timeframe === "7" ? "Last 7 days" : timeframe === "30" ? "Last 30 days" : "Last 60 days")

  return (
    <>
      <Head title="Dashboard" />
      <GlowBg />

      <div className="min-h-screen bg-zinc-50">
        {/* Top bar */}
        <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={reduceMotion ? false : { scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50"
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold tracking-tight text-zinc-900">Smoodify</div>
                  <Badge variant="secondary" className="rounded-full">
                    {headerRangeLabel}
                  </Badge>
                </div>
                <div className="mt-0.5 text-sm text-zinc-500">Hi {greetingName} — your listening → mood story, at a glance.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Chip>
                <span className={cn("mr-2 h-2 w-2 rounded-full", autoRefresh ? "bg-emerald-500" : "bg-zinc-400")} />
                {autoRefresh ? "Live" : "Paused"}
              </Chip>

              {lastUpdatedAt ? (
                <Chip>
                  <Clock className="h-3.5 w-3.5" />
                  Updated {lastUpdatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </Chip>
              ) : null}

              <div className="hidden md:block">
                <Switch checked={autoRefresh} onCheckedChange={(v) => setAutoRefresh(Boolean(v))} />
              </div>

              <Button variant="outline" onClick={() => setAutoRefresh((v) => !v)} className="rounded-2xl">
                {autoRefresh ? "Pause" : "Resume"}
              </Button>

              <Button
  variant="secondary"
  onClick={generateDemoData}
  className="rounded-2xl"
  disabled={isGeneratingDemo}
>
  <Sparkles className={cn("mr-2 h-4 w-4", isGeneratingDemo && "animate-pulse")} />
  {isGeneratingDemo ? "Generating…" : "Generate demo data"}
</Button>

              <Button onClick={refresh} className="rounded-2xl" disabled={isRefreshing}>
                <RefreshCcw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Controls */}
          <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick filters</CardTitle>
                <CardDescription>Focus the dashboard without leaving the page.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={timeframe === "7" ? "default" : "secondary"}
                    className="rounded-2xl"
                    onClick={() => setTimeframe("7")}
                  >
                    7d
                  </Button>
                  <Button
                    variant={timeframe === "30" ? "default" : "secondary"}
                    className="rounded-2xl"
                    onClick={() => setTimeframe("30")}
                  >
                    30d
                  </Button>
                  <Button
                    variant={timeframe === "60" ? "default" : "secondary"}
                    className="rounded-2xl"
                    onClick={() => setTimeframe("60")}
                  >
                    60d
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="rounded-2xl">
                        <ListFilter className="mr-2 h-4 w-4" /> Focus
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Primary metric</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setMetricFocus("mood")}>
                        <Heart className="mr-2 h-4 w-4" /> Mood (valence/energy)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMetricFocus("plays")}>
                        <Music className="mr-2 h-4 w-4" /> Plays volume
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-zinc-500">
                  Tip: Keep <span className="font-medium text-zinc-800">Live</span> on while jobs are running; it will poll automatically.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Today’s overview</CardTitle>
                <CardDescription>High-level signals across the selected time window.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <MetricPill
                  label="Days analyzed"
                  icon={<CalendarDays className="h-5 w-5" />}
                  value={fmtInt(stats?.daysCount) as any}
                  hint="Distinct days"
                />
                <MetricPill
                  label="Total plays"
                  icon={<Music className="h-5 w-5" />}
                  value={fmtInt(stats?.eventsCount) as any}
                  hint="Listening events"
                />
                <MetricPill
                  label="Streak"
                  icon={<Flame className="h-5 w-5" />}
                  value={fmtInt(stats?.streakDays) as any}
                  hint="Consecutive days"
                />
              </CardContent>
            </Card>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: Trend + Heatmap */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Mood trend</CardTitle>
                      <CardDescription>Valence & energy aggregated per day.</CardDescription>
                    </div>
                    <Chip>
                      <Activity className="h-3.5 w-3.5" /> Daily aggregates
                    </Chip>
                  </div>
                </CardHeader>

                <CardContent>
                  {!hasData ? (
                    <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6">
                      <div className="text-sm font-semibold text-zinc-900">Waiting for analysis results…</div>
                      <div className="mt-1 text-sm text-zinc-600">
                        If you just generated demo data, the queue job may still be running. This page will refresh automatically.
                      </div>
                      <div className="mt-6 grid gap-3">
                        <Skeleton className="h-8 w-2/3" />
                        <Skeleton className="h-52 w-full" />
                        <div className="grid grid-cols-3 gap-3">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-zinc-600">Avg valence</div>
                            <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50">
                              <Heart className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                            <AnimatedStat value={stats?.avgValence} format={(n) => clamp01(n).toFixed(2)} />
                          </div>
                          <div className="mt-2">
                            <TrendLine pct={stats?.valenceTrendPct} />
                          </div>
                          <div className="mt-3 text-xs text-zinc-500">0 = low mood • 1 = high mood</div>
                        </div>

                        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-zinc-600">Avg energy</div>
                            <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50">
                              <Zap className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                            <AnimatedStat value={stats?.avgEnergy} format={(n) => clamp01(n).toFixed(2)} />
                          </div>
                          <div className="mt-2">
                            <TrendLine pct={stats?.energyTrendPct} />
                          </div>
                          <div className="mt-3 text-xs text-zinc-500">0 = calm • 1 = energetic</div>
                        </div>

                        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-zinc-600">Momentum</div>
                            <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50">
                              <LineChart className="h-5 w-5" />
                            </div>
                          </div>

                          <div className="mt-3 space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-xs text-zinc-600">
                                <span>Valence p90</span>
                                <span className="font-medium text-zinc-900">{fmt01(insights.vP90)}</span>
                              </div>
                              <Progress value={Number.isFinite(insights.vP90 as any) ? clamp01(insights.vP90 as number) * 100 : 0} />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-xs text-zinc-600">
                                <span>Energy p90</span>
                                <span className="font-medium text-zinc-900">{fmt01(insights.eP90)}</span>
                              </div>
                              <Progress value={Number.isFinite(insights.eP90 as any) ? clamp01(insights.eP90 as number) * 100 : 0} />
                            </div>
                          </div>
                        </div>
                      </div>


                      <Separator className="my-5" />

                      {/* ✅ Chart (fixed): explicit fills/strokes + guards for “all null” */}
                      <div className="h-[340px] min-h-[340px]">
                        {!mounted ? (
                          <Skeleton className="h-full w-full" />
                        ) : metricFocus === "plays" && !hasPlayData ? (
                          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
                            <div>
                              <div className="text-sm font-semibold text-zinc-900">No play-volume data in this window</div>
                              <div className="mt-1 text-sm text-zinc-600">Try a wider range, or confirm events_count is being sent.</div>
                            </div>
                          </div>
                        ) : metricFocus === "mood" && !hasMoodData ? (
                          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
                            <div>
                              <div className="text-sm font-semibold text-zinc-900">No mood aggregates yet</div>
                              <div className="mt-1 text-sm text-zinc-600">avg_valence / avg_energy are all null in this window.</div>
                            </div>
                          </div>
                        ) : (
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                            // ✅ Key forces recalculation when toggling focus/timeframe (fixes “blank until resize” cases)
                            key={`${timeframe}-${metricFocus}-${chartData.length}`}
                          >
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,24,27,0.10)" />
                              <XAxis dataKey="day" tickFormatter={niceDateLabel} minTickGap={18} />
                              <YAxis yAxisId="left" domain={[0, 1]} tickCount={6} />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickCount={6}
                                allowDecimals={false}
                                domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax || 0))]}
                              />
                              <Tooltip content={<TooltipCard />} />

                              {metricFocus === "plays" ? (
                                <Bar
                                  yAxisId="right"
                                  dataKey="events_count"
                                  radius={[10, 10, 0, 0]}
                                  fill="rgba(24,24,27,0.80)"
                                />
                              ) : (
                                <>
                                  <Area
                                    type="monotone"
                                    yAxisId="left"
                                    dataKey="avg_valence"
                                    stroke="rgba(239,68,68,0.95)"
                                    fill="rgba(239,68,68,0.18)"
                                    strokeWidth={2}
                                    connectNulls
                                    isAnimationActive={false}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                  />

                                  <Area
                                    type="monotone"
                                    yAxisId="left"
                                    dataKey="avg_energy"
                                    stroke="rgba(59,130,246,0.95)"
                                    fill="rgba(59,130,246,0.14)"
                                    strokeWidth={2}
                                    connectNulls
                                    isAnimationActive={false}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                  />

                                  <Bar
                                    yAxisId="right"
                                    dataKey="events_count"
                                    radius={[10, 10, 0, 0]}
                                    fill="rgba(24,24,27,0.55)"
                                    opacity={0.35}
                                  />
                                </>
                              )}
                            </ComposedChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                        <Chip>
                          <Heart className="h-4 w-4" /> Valence
                        </Chip>
                        <Chip>
                          <Zap className="h-4 w-4" /> Energy
                        </Chip>
                        <Chip>
                          <Music className="h-4 w-4" /> Plays
                        </Chip>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {mounted && hasData ? <Heatmap points={chartData} /> : null}
            </div>

            {/* Right: Insights + Patterns */}
            <div className="space-y-6">
              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Highlights</CardTitle>
                  <CardDescription>Quick, explainable nuggets from the same window.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InsightRow
                    icon={<Sparkles className="h-5 w-5" />}
                    title="Best day"
                    sub={insights.best?.day ? niceDateLabel(insights.best.day) : "—"}
                    value={insights.best ? fmt01(insights.best.avg_valence ?? insights.best.avg_energy ?? null) : "—"}
                  />
                  <InsightRow
                    icon={<TrendingDown className="h-5 w-5" />}
                    title="Toughest day"
                    sub={insights.worst?.day ? niceDateLabel(insights.worst.day) : "—"}
                    value={insights.worst ? fmt01(insights.worst.avg_valence ?? insights.worst.avg_energy ?? null) : "—"}
                  />
                  <InsightRow
                    icon={<Music className="h-5 w-5" />}
                    title="Most plays"
                    sub={insights.mostPlays?.day ? niceDateLabel(insights.mostPlays.day) : "—"}
                    value={insights.mostPlays ? fmtInt(insights.mostPlays.events_count) : "—"}
                  />
                  <InsightRow
                    icon={<Heart className="h-5 w-5" />}
                    title="Best weekday"
                    sub={insights.bestDow ? `${insights.bestDow.k}` : "—"}
                    value={insights.bestDow ? clamp01(insights.bestDow.avg).toFixed(2) : "—"}
                  />
                  <InsightRow
                    icon={<Zap className="h-5 w-5" />}
                    title="Energy ↔ Valence"
                    sub="Correlation across days"
                    value={insights.corr === null ? "—" : insights.corr.toFixed(2)}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Patterns</CardTitle>
                      <CardDescription>Explainable insights from your listening habits.</CardDescription>
                    </div>
                    <Chip>
                      <Sparkles className="h-4 w-4" /> Insights
                    </Chip>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search patterns…"
                        className="pl-9 rounded-2xl"
                      />
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Tabs defaultValue="top" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="top">Top</TabsTrigger>
                      <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>

                    <TabsContent value="top" className="mt-4">
                      <PatternList
                        items={patternList.slice(0, 6)}
                        emptyHint="Once enough listening data exists per weekday/time bucket, patterns will show up here."
                      />
                      {patternList.length > 6 ? <div className="mt-4 text-xs text-zinc-500">Showing 6 of {patternList.length} patterns.</div> : null}
                    </TabsContent>

                    <TabsContent value="all" className="mt-4">
                      <PatternList items={patternList} emptyHint="Try widening the time window or clearing search." />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">What to do next</CardTitle>
                  <CardDescription>Small actions that tend to improve signal quality.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-zinc-600">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="font-semibold text-zinc-900">Keep it consistent</div>
                    <div className="mt-1">
                      More listening days = cleaner patterns. Aim for at least{" "}
                      <span className="font-medium text-zinc-900">10–14 active days</span> in the window.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="font-semibold text-zinc-900">Try a routine playlist</div>
                    <div className="mt-1">A stable baseline playlist makes it easier to spot what changes your mood.</div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="font-semibold text-zinc-900">Refresh after imports</div>
                    <div className="mt-1">
                      If you just imported history, hit <span className="font-medium text-zinc-900">Refresh</span> once or leave Live on.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            <div className="font-semibold text-zinc-900">Tip</div>
            <div className="mt-1">
              If analysis is still running, keep this tab open — it will refresh automatically. You can also hit{" "}
              <span className="font-semibold">Refresh</span>.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function PatternList({ items, emptyHint }: { items: Pattern[]; emptyHint: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null)

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold text-zinc-900">No patterns yet</div>
        <div className="mt-1 text-sm text-zinc-600">{emptyHint}</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((p, idx) => {
        const key = `${String(p.id ?? p.pattern_key ?? "p")}-${idx}`
        const isOpen = openKey === key

        return (
          <motion.div
            key={key}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 text-left"
              onClick={() => setOpenKey(isOpen ? null : key)}
            >
              <div>
                <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
                {p.summary ? <div className="mt-1 text-sm text-zinc-600">{p.summary}</div> : null}

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
                  <Chip>
                    <Zap className="h-3.5 w-3.5" /> Energy{" "}
                    {p.meta?.avg_energy === undefined || p.meta?.avg_energy === null ? "—" : clamp01(p.meta.avg_energy).toFixed(2)}
                  </Chip>
                  <Chip>
                    <Heart className="h-3.5 w-3.5" /> Valence{" "}
                    {p.meta?.avg_valence === undefined || p.meta?.avg_valence === null ? "—" : clamp01(p.meta.avg_valence).toFixed(2)}
                  </Chip>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-800">
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
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <Separator className="my-4" />
                  <div className="grid gap-3 text-sm text-zinc-600">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="font-semibold text-zinc-900">Why this matters</div>
                      <div className="mt-1">
                        Patterns become more reliable with repeated days in the same context (weekday/time). If this one resonates, try repeating it for a week.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="font-semibold text-zinc-900">Try next</div>
                      <div className="mt-1">
                        If energy is high but valence dips, experiment with calmer playlists before bed. If both rise, bookmark the playlist that led to it.
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
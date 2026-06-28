/* Shared date-range and time-series grouping helpers used by all analytics admin routes. */

export type Period = "week" | "month" | "year" | "all"
export type GroupBy = "week" | "month" | "year"

interface DateRangeOpts {
  weekStart?: string
  targetMonth?: string
  targetYear?: string
}

export function getDateRange(period: Period, opts: DateRangeOpts = {}): { from: string | null; to: string } {
  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]

  if (period === "week") {
    let monday: Date
    if (opts.weekStart && /^\d{4}-\d{2}-\d{2}$/.test(opts.weekStart)) {
      monday = new Date(opts.weekStart + "T00:00:00")
    } else {
      monday = new Date(now)
      const day = monday.getDay() || 7
      monday.setDate(monday.getDate() - day + 1)
    }
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { from: monday.toISOString().split("T")[0], to: sunday.toISOString().split("T")[0] }
  }

  if (period === "month") {
    if (opts.targetMonth && /^\d{4}-\d{2}$/.test(opts.targetMonth)) {
      const [year, month] = opts.targetMonth.split("-").map(Number)
      const from = `${year}-${String(month).padStart(2, "0")}-01`
      const lastDay = new Date(year, month, 0).getDate()
      return { from, to: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}` }
    }
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: todayStr }
  }

  if (period === "year") {
    const year = opts.targetYear && /^\d{4}$/.test(opts.targetYear) ? parseInt(opts.targetYear) : now.getFullYear()
    return { from: `${year}-01-01`, to: year === now.getFullYear() ? todayStr : `${year}-12-31` }
  }

  return { from: null, to: todayStr }
}

export function toMonthKey(dateStr: string): string { return dateStr.slice(0, 7) }
export function toYearKey(dateStr: string): string  { return dateStr.slice(0, 4) }

export function toWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  const day = d.getDay() || 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  const y  = monday.getFullYear()
  const m  = String(monday.getMonth() + 1).padStart(2, "0")
  const dd = String(monday.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

/* pg returns model.number() columns as strings — parse before arithmetic. */
export function n(v: any): number {
  if (v == null) return 0
  if (typeof v === "number") return isNaN(v) ? 0 : v
  const parsed = parseFloat(String(v))
  return isNaN(parsed) ? 0 : parsed
}

export function groupByKey(dateStr: string, groupBy: GroupBy): string {
  return groupBy === "month" ? toMonthKey(dateStr)
       : groupBy === "year"  ? toYearKey(dateStr)
       : toWeekKey(dateStr)
}

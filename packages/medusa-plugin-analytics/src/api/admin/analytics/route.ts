/**
 * GET /admin/analytics — full dashboard: overview, time series, top products,
 *     category stats, top customers, and order status breakdown.
 *
 * Query params:
 *   period      week | month | year | all  (default: month)
 *   week_start  YYYY-MM-DD  (ISO monday, only used with period=week)
 *   month       YYYY-MM     (only used with period=month)
 *   year        YYYY        (only used with period=year)
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../../../modules/analytics"
import { getDateRange, n, groupByKey, type Period, type GroupBy } from "../../../shared/date-utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const analyticsService: any = req.scope.resolve(ANALYTICS_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const period = (req.query.period as Period) ?? "month"
  const { from, to } = getDateRange(period, {
    weekStart:   req.query.week_start  as string | undefined,
    targetMonth: req.query.month       as string | undefined,
    targetYear:  req.query.year        as string | undefined,
  })
  const dateFilter: any = from ? { $gte: from, $lte: to } : undefined
  const filters: any    = dateFilter ? { date: dateFilter } : {}

  const [dailyStats, productStats, customerStats] = await Promise.all([
    analyticsService.listDailyStats(filters, { order: { date: "ASC" } }),
    analyticsService.listProductStats(filters),
    analyticsService.listCustomerStats(filters),
  ])

  /* ── Overview ──────────────────────────────────────────────────────────────── */
  const totalOrders  = dailyStats.reduce((s, r) => s + n(r.order_count), 0)
  const totalRevenue = dailyStats.reduce((s, r) => s + n(r.revenue), 0)
  const currencyCode = dailyStats[0]?.currency_code ?? "eur"

  /* ── Time Series ────────────────────────────────────────────────────────────── */
  const groupBy: GroupBy = period === "all" ? "year" : period === "year" ? "month" : "week"
  const seriesMap = new Map<string, { orders: number; revenue: number }>()
  for (const stat of dailyStats) {
    const key = groupByKey(stat.date, groupBy)
    const ex  = seriesMap.get(key) ?? { orders: 0, revenue: 0 }
    seriesMap.set(key, { orders: ex.orders + n(stat.order_count), revenue: ex.revenue + n(stat.revenue) })
  }
  const timeSeries = Array.from(seriesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({ period, ...data }))

  /* ── Top Products (aggregated across all variants) ──────────────────────────── */
  const productMap = new Map<string, { product_title: string; units_sold: number; revenue: number }>()
  for (const stat of productStats) {
    const ex = productMap.get(stat.product_id)
    if (ex) { ex.units_sold += n(stat.units_sold); ex.revenue += n(stat.revenue) }
    else     productMap.set(stat.product_id, { product_title: stat.product_title, units_sold: n(stat.units_sold), revenue: n(stat.revenue) })
  }

  /* ── Category Stats + resolve current product IDs ───────────────────────────── */
  /* Match by product_title (stable across re-seeds) rather than product_id. */
  const titleToCurrentId = new Map<string, string>()
  let categoryStats: { category_id: string; category_name: string; units_sold: number; revenue: number }[] = []
  try {
    if (productMap.size > 0) {
      const { data: allProducts } = await query.graph({
        entity: "product",
        fields: ["id", "title", "categories.id", "categories.name"],
        pagination: { take: 1000 },
      })
      const titleToCats = new Map<string, { id: string; name: string }[]>()
      for (const p of allProducts as any[]) {
        titleToCurrentId.set(p.title, p.id)
        if (p.categories?.length) titleToCats.set(p.title, p.categories)
      }
      const catMap = new Map<string, { name: string; units_sold: number; revenue: number }>()
      for (const productData of productMap.values()) {
        for (const cat of titleToCats.get(productData.product_title) ?? []) {
          if (!cat?.id) continue
          const ex = catMap.get(cat.id)
          if (ex) { ex.units_sold += productData.units_sold; ex.revenue += productData.revenue }
          else     catMap.set(cat.id, { name: cat.name, units_sold: productData.units_sold, revenue: productData.revenue })
        }
      }
      categoryStats = Array.from(catMap.entries())
        .map(([category_id, data]) => ({ category_id, category_name: data.name, units_sold: data.units_sold, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
    }
  } catch (e) { console.error("[analytics] category stats failed:", e) }

  const topProducts = Array.from(productMap.entries())
    .map(([product_id, data]) => ({ product_id, current_product_id: titleToCurrentId.get(data.product_title) ?? null, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  /* ── Top Customers ──────────────────────────────────────────────────────────── */
  const customerMap = new Map<string, { customer_email: string | null; customer_name: string | null; order_count: number; revenue: number }>()
  for (const stat of customerStats) {
    const ex = customerMap.get(stat.customer_id)
    if (ex) { ex.order_count += n(stat.order_count); ex.revenue += n(stat.revenue) }
    else customerMap.set(stat.customer_id, {
      customer_email: (stat as any).customer_email ?? null,
      customer_name:  (stat as any).customer_name  ?? null,
      order_count:    n(stat.order_count),
      revenue:        n(stat.revenue),
    })
  }

  /* Resolve current customer IDs by email (IDs can become stale after customer re-creation) */
  const emailToCurrentId = new Map<string, string>()
  try {
    const emails = Array.from(customerMap.values()).map(c => c.customer_email).filter(Boolean) as string[]
    if (emails.length > 0) {
      const { data: currentCustomers } = await query.graph({ entity: "customer", fields: ["id", "email"], filters: { email: emails } })
      for (const c of currentCustomers as any[]) { if (c.email) emailToCurrentId.set(c.email, c.id) }
    }
  } catch { /* not critical */ }

  const topCustomers = Array.from(customerMap.entries())
    .map(([customer_id, data]) => ({
      customer_id,
      current_customer_id: data.customer_email ? (emailToCurrentId.get(data.customer_email) ?? null) : null,
      ...data,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  /* ── Order Status Breakdown ─────────────────────────────────────────────────── */
  let statusCounts: Record<string, number> = {}
  try {
    const createdAtFilter = from ? { created_at: { $gte: `${from}T00:00:00.000Z`, $lte: `${to}T23:59:59.999Z` } } : {}
    const { data: orders } = await query.graph({ entity: "order", fields: ["id", "status"], filters: createdAtFilter })
    for (const order of orders as any[]) {
      const s = order.status ?? "unknown"
      statusCounts[s] = (statusCounts[s] ?? 0) + 1
    }
  } catch { /* not critical */ }

  return res.json({
    overview: { total_orders: totalOrders, total_revenue: totalRevenue, avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0, currency_code: currencyCode },
    time_series: timeSeries,
    top_products: topProducts,
    category_stats: categoryStats,
    top_customers: topCustomers,
    status_counts: statusCounts,
    period,
    date_range: { from, to },
  })
}

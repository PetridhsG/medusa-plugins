/**
 * GET /admin/analytics/customer-stats?customer_id=X&period=month&month=YYYY-MM&year=YYYY
 * Time-series + overview for a single customer. Resolves by email to handle stale IDs.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../../../../modules/analytics"
import { getDateRange, n, groupByKey, type Period, type GroupBy } from "../../../../shared/date-utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const analyticsService: any = req.scope.resolve(ANALYTICS_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const customerId = req.query.customer_id as string
  if (!customerId) return res.status(400).json({ message: "customer_id is required" })

  /* Resolve email (stable key) from current customer ID */
  let customerEmail: string | null = null
  try {
    const { data: customers } = await query.graph({ entity: "customer", fields: ["id", "email"], filters: { id: customerId } })
    customerEmail = (customers as any[])[0]?.email ?? null
  } catch { /* fall through to ID-based query */ }

  const period  = (req.query.period as Period) ?? "month"
  const groupBy: GroupBy = period === "all" ? "year" : period === "year" ? "month" : "week"
  const { from, to } = getDateRange(period, { targetMonth: req.query.month as string | undefined, targetYear: req.query.year as string | undefined })
  const dateFilter: any = from ? { $gte: from, $lte: to } : undefined
  const idFilter        = customerEmail ? { customer_email: customerEmail } : { customer_id: customerId }
  const filters: any    = { ...idFilter, ...(dateFilter ? { date: dateFilter } : {}) }

  const stats = await analyticsService.listCustomerStats(filters, { order: { date: "ASC" } })

  let totalOrders = 0, totalRevenue = 0
  const currencyCode = stats[0]?.currency_code ?? "eur"
  const seriesMap = new Map<string, { orders: number; revenue: number }>()

  for (const stat of stats) {
    const orders = n(stat.order_count), rev = n(stat.revenue)
    totalOrders  += orders; totalRevenue += rev
    const key = groupByKey(stat.date, groupBy)
    const ex  = seriesMap.get(key) ?? { orders: 0, revenue: 0 }
    seriesMap.set(key, { orders: ex.orders + orders, revenue: ex.revenue + rev })
  }

  const timeSeries = Array.from(seriesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({ period, ...data }))

  return res.json({
    overview: { order_count: totalOrders, revenue: totalRevenue, avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0, currency_code: currencyCode },
    time_series: timeSeries,
    period,
    date_range: { from, to },
  })
}

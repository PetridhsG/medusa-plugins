/**
 * GET /admin/analytics/product-stats?product_id=X&period=month&month=YYYY-MM&year=YYYY
 * Time-series + overview for a single product. Resolves by title to handle stale IDs.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../../../../modules/analytics"
import { getDateRange, n, groupByKey, type Period, type GroupBy } from "../../../../shared/date-utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const analyticsService: any = req.scope.resolve(ANALYTICS_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const productId = req.query.product_id as string
  if (!productId) return res.status(400).json({ message: "product_id is required" })

  /* Resolve title (stable key that survives re-seeding) from current ID */
  let productTitle: string | null = null
  try {
    const { data: products } = await query.graph({ entity: "product", fields: ["id", "title"], filters: { id: productId } })
    productTitle = (products as any[])[0]?.title ?? null
  } catch { /* fall through to ID-based query */ }

  const period  = (req.query.period as Period) ?? "month"
  const groupBy: GroupBy = period === "all" ? "year" : period === "year" ? "month" : "week"
  const { from, to } = getDateRange(period, { targetMonth: req.query.month as string | undefined, targetYear: req.query.year as string | undefined })
  const dateFilter: any = from ? { $gte: from, $lte: to } : undefined
  const idFilter        = productTitle ? { product_title: productTitle } : { product_id: productId }
  const filters: any    = { ...idFilter, ...(dateFilter ? { date: dateFilter } : {}) }

  const stats = await analyticsService.listProductStats(filters, { order: { date: "ASC" } })

  let totalUnits = 0, totalRevenue = 0
  const currencyCode = stats[0]?.currency_code ?? "eur"
  const seriesMap = new Map<string, { units_sold: number; revenue: number }>()

  for (const stat of stats) {
    totalUnits   += n(stat.units_sold)
    totalRevenue += n(stat.revenue)
    const key = groupByKey(stat.date, groupBy)
    const ex  = seriesMap.get(key) ?? { units_sold: 0, revenue: 0 }
    seriesMap.set(key, { units_sold: ex.units_sold + n(stat.units_sold), revenue: ex.revenue + n(stat.revenue) })
  }

  const timeSeries = Array.from(seriesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({ period, ...data }))

  return res.json({
    overview: { units_sold: totalUnits, revenue: totalRevenue, currency_code: currencyCode },
    time_series: timeSeries,
    period,
    date_range: { from, to },
  })
}

/**
 * GET /admin/analytics/category-stats?category_id=X&period=month&month=YYYY-MM&year=YYYY
 * Time-series + overview + top products for a single category.
 * Filters stats by product_title (stable across re-seeds) not product_id.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../../../../modules/analytics"
import { getDateRange, n, groupByKey, type Period, type GroupBy } from "../../../../shared/date-utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const analyticsService: any = req.scope.resolve(ANALYTICS_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const categoryId = req.query.category_id as string
  if (!categoryId) return res.status(400).json({ message: "category_id is required" })

  const period  = (req.query.period as Period) ?? "month"
  const groupBy: GroupBy = period === "all" ? "year" : period === "year" ? "month" : "week"
  const { from, to } = getDateRange(period, { targetMonth: req.query.month as string | undefined, targetYear: req.query.year as string | undefined })

  /* Fetch product titles in this category (titles are the stable filter key) */
  let productTitles: string[] = []
  try {
    const { data: products } = await query.graph({ entity: "product", fields: ["id", "title"], filters: { categories: { id: categoryId } } as any })
    productTitles = (products as any[]).map((p) => p.title).filter(Boolean)
  } catch { /* empty category or query failure */ }

  if (productTitles.length === 0) {
    return res.json({ overview: { units_sold: 0, revenue: 0, currency_code: "eur" }, time_series: [], top_products: [], period, date_range: { from, to } })
  }

  const dateFilter: any = from ? { $gte: from, $lte: to } : undefined
  const filters: any = { product_title: productTitles, ...(dateFilter ? { date: dateFilter } : {}) }
  const stats = await analyticsService.listProductStats(filters, { order: { date: "ASC" } })

  let totalUnits = 0, totalRevenue = 0
  const currencyCode = stats[0]?.currency_code ?? "eur"
  const seriesMap  = new Map<string, { units_sold: number; revenue: number }>()
  const productMap = new Map<string, { product_title: string; units_sold: number; revenue: number }>()

  for (const stat of stats) {
    const units = n(stat.units_sold), rev = n(stat.revenue)
    totalUnits += units; totalRevenue += rev

    const key = groupByKey(stat.date, groupBy)
    const ex  = seriesMap.get(key) ?? { units_sold: 0, revenue: 0 }
    seriesMap.set(key, { units_sold: ex.units_sold + units, revenue: ex.revenue + rev })

    const exProd = productMap.get(stat.product_title)
    if (exProd) { exProd.units_sold += units; exProd.revenue += rev }
    else productMap.set(stat.product_title, { product_title: stat.product_title, units_sold: units, revenue: rev })
  }

  const timeSeries  = Array.from(seriesMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([period, data]) => ({ period, ...data }))
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

  return res.json({
    overview: { units_sold: totalUnits, revenue: totalRevenue, currency_code: currencyCode },
    time_series: timeSeries,
    top_products: topProducts,
    period,
    date_range: { from, to },
  })
}

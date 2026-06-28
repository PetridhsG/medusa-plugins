/**
 * GET /admin/analytics/variants?product_id=X&period=month&month=YYYY-MM&year=YYYY
 * Variant-level sales breakdown for a single product.
 * Resolves by product_title to handle stale product_ids after re-seeding.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../../../../modules/analytics"
import { getDateRange, n, type Period } from "../../../../shared/date-utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const analyticsService: any = req.scope.resolve(ANALYTICS_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const productId = req.query.product_id as string
  if (!productId) return res.status(400).json({ message: "product_id is required" })

  let productTitle: string | null = null
  try {
    const { data: products } = await query.graph({ entity: "product", fields: ["id", "title"], filters: { id: productId } })
    productTitle = (products as any[])[0]?.title ?? null
  } catch { /* fall through to ID-based query */ }

  const period = (req.query.period as Period) ?? "month"
  const { from, to } = getDateRange(period, { targetMonth: req.query.month as string | undefined, targetYear: req.query.year as string | undefined })
  const dateFilter: any = from ? { $gte: from, $lte: to } : undefined
  const idFilter        = productTitle ? { product_title: productTitle } : { product_id: productId }
  const filters: any    = { ...idFilter, ...(dateFilter ? { date: dateFilter } : {}) }

  const stats = await analyticsService.listProductStats(filters)

  const variantMap = new Map<string, { variant_title: string | null; units_sold: number; revenue: number }>()
  for (const stat of stats) {
    const key = (stat as any).variant_id ?? "unknown"
    const ex  = variantMap.get(key)
    const rev = n(stat.revenue)
    if (ex) { ex.units_sold += n(stat.units_sold); ex.revenue += rev }
    else variantMap.set(key, { variant_title: (stat as any).variant_title ?? null, units_sold: n(stat.units_sold), revenue: rev })
  }

  const variants = Array.from(variantMap.entries())
    .map(([variant_id, data]) => ({ variant_id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  return res.json({ variants })
}

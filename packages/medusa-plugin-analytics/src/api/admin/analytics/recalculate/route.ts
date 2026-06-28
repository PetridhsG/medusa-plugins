/**
 * POST /admin/analytics/recalculate
 * Drops all analytics stats and rebuilds them from every non-cancelled order.
 * Skips line items whose product no longer exists in the catalogue.
 * Processes orders in batches to avoid memory pressure on large stores.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../../../../modules/analytics"
import { safeNum, toDateString } from "../../../../shared/bignumber"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const analyticsService: any = req.scope.resolve(ANALYTICS_MODULE)
  const query  = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const logger = req.scope.resolve("logger")

  /* ── 1. Wipe existing stats ────────────────────────────────────────────────── */
  let wipedDaily = 0, wipedProduct = 0, wipedCustomer = 0
  for (;;) {
    const batch = await analyticsService.listDailyStats({}, { take: 100 })
    if (!batch?.length) break
    await analyticsService.deleteDailyStats(batch.map((r: any) => r.id))
    wipedDaily += batch.length
  }
  for (;;) {
    const batch = await analyticsService.listProductStats({}, { take: 100 })
    if (!batch?.length) break
    await analyticsService.deleteProductStats(batch.map((r: any) => r.id))
    wipedProduct += batch.length
  }
  for (;;) {
    const batch = await analyticsService.listCustomerStats({}, { take: 100 })
    if (!batch?.length) break
    await analyticsService.deleteCustomerStats(batch.map((r: any) => r.id))
    wipedCustomer += batch.length
  }
  logger.info(`[analytics] Wiped ${wipedDaily} daily, ${wipedProduct} product, ${wipedCustomer} customer records`)

  /* ── 2. Load all existing product IDs + titles (stable filter keys) ────────── */
  const existingProductIds    = new Set<string>()
  const existingProductTitles = new Set<string>()
  let productOffset = 0
  while (true) {
    const { data: products } = await query.graph({ entity: "product", fields: ["id", "title"], pagination: { take: 500, skip: productOffset } })
    if (!products?.length) break
    for (const p of products as any[]) {
      if (p.id)    existingProductIds.add(p.id)
      if (p.title) existingProductTitles.add(p.title)
    }
    if (products.length < 500) break
    productOffset += 500
  }
  logger.info(`[analytics] Found ${existingProductIds.size} existing products`)

  /* ── 3. Page through all completed orders and accumulate stats ─────────────── */
  const BATCH = 150
  let offset = 0, processedCount = 0, skippedItems = 0

  const dailyMap    = new Map<string, { order_count: number; revenue: number; currency_code: string }>()
  const productMap  = new Map<string, { date: string; product_id: string; product_title: string; variant_id: string | null; variant_title: string | null; units_sold: number; revenue: number; currency_code: string }>()
  const customerMap = new Map<string, { date: string; customer_id: string; customer_email: string | null; customer_name: string | null; order_count: number; revenue: number; currency_code: string }>()

  while (true) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "status", "total", "currency_code", "created_at", "customer_id", "customer.id", "customer.email", "customer.first_name", "customer.last_name", "customer.has_account", "items.*"],
      pagination: { take: BATCH, skip: offset },
    })
    if (!orders?.length) break

    for (const order of orders as any[]) {
      if (order.status === "canceled") continue
      processedCount++

      const date     = toDateString(order.created_at)
      const currency = order.currency_code ?? "eur"
      const total    = safeNum(order.total)

      const dailyKey = `${date}::${currency}`
      const exDaily  = dailyMap.get(dailyKey)
      if (exDaily) { exDaily.order_count += 1; exDaily.revenue += total }
      else dailyMap.set(dailyKey, { order_count: 1, revenue: total, currency_code: currency })

      for (const item of (order.items ?? []) as any[]) {
        const productTitle = item.product_title ?? item.title ?? ""
        const productId    = item.product_id ?? item.id
        const productExists =
          (productId    && existingProductIds.has(productId))    ||
          (productTitle && existingProductTitles.has(productTitle))

        if (!productExists) { skippedItems++; continue }

        const variantId    = item.variant_id ?? item.id
        const variantTitle = item.variant_title ?? item.subtitle ?? null
        const qty          = safeNum(item.quantity)
        const lineRevenue  = safeNum(item.unit_price) * qty
        const productKey   = `${date}::${variantId}::${currency}`
        const exProduct    = productMap.get(productKey)
        if (exProduct) { exProduct.units_sold += qty; exProduct.revenue += lineRevenue }
        else productMap.set(productKey, { date, product_id: productId, product_title: productTitle, variant_id: variantId, variant_title: variantTitle, units_sold: qty, revenue: lineRevenue, currency_code: currency })
      }

      const customerId: string | null = order.customer_id ?? order.customer?.id ?? null
      if (customerId && order.customer?.has_account === true) {
        const customer  = order.customer as any
        const firstName = customer?.first_name ?? ""
        const lastName  = customer?.last_name  ?? ""
        const customerKey = `${date}::${customerId}::${currency}`
        const exCustomer  = customerMap.get(customerKey)
        if (exCustomer) { exCustomer.order_count += 1; exCustomer.revenue += total }
        else customerMap.set(customerKey, { date, customer_id: customerId, customer_email: customer?.email ?? null, customer_name: (firstName || lastName) ? `${firstName} ${lastName}`.trim() : null, order_count: 1, revenue: total, currency_code: currency })
      }
    }

    if (orders.length < BATCH) break
    offset += BATCH
  }

  /* ── 4. Bulk-create accumulated records ────────────────────────────────────── */
  if (dailyMap.size > 0)    await analyticsService.createDailyStats(Array.from(dailyMap.entries()).map(([key, data]) => ({ date: key.split("::")[0], ...data })))
  if (productMap.size > 0)  await analyticsService.createProductStats(Array.from(productMap.values()))
  if (customerMap.size > 0) await analyticsService.createCustomerStats(Array.from(customerMap.values()))

  logger.info(`[analytics] Recalculated: ${processedCount} orders → ${dailyMap.size} daily, ${productMap.size} product, ${customerMap.size} customer records (${skippedItems} items skipped)`)

  return res.json({ success: true, orders_processed: processedCount, daily_records: dailyMap.size, product_records: productMap.size, customer_records: customerMap.size, items_skipped: skippedItems })
}

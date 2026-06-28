/**
 * Step that upserts DailyStat, ProductStat, and CustomerStat for a single completed order.
 * Line items whose product no longer exists in the catalogue are skipped.
 * Resilient to product re-seeding (ID changes, same title) via dual ID+title existence check.
 */
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../../modules/analytics"
import { safeNum, toDateString } from "../../shared/bignumber"

type Input = { order_id: string }

export const updateAnalyticsStep = createStep(
  "update-analytics",
  async (input: Input, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const analyticsService: any = container.resolve(ANALYTICS_MODULE)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id", "total", "currency_code", "created_at",
        "customer_id",
        "customer.id", "customer.email",
        "customer.first_name", "customer.last_name", "customer.has_account",
        "items.*",
      ],
      filters: { id: input.order_id },
    })

    const order = orders[0] as any
    if (!order) return new StepResponse(null)

    const date      = toDateString(order.created_at)
    const currency  = order.currency_code ?? "eur"
    const orderTotal = safeNum(order.total)
    const items: any[] = order.items ?? []

    /* ── Check which products still exist (by ID or title) ────────────────────── */
    const itemProductIds = [...new Set(items.map((i: any) => i.product_id ?? i.id).filter(Boolean) as string[])]
    const itemTitles     = [...new Set(items.map((i: any) => i.product_title ?? i.title).filter(Boolean) as string[])]

    const existingProductIds    = new Set<string>()
    const existingProductTitles = new Set<string>()

    if (itemProductIds.length > 0 || itemTitles.length > 0) {
      if (itemProductIds.length > 0) {
        const { data: byId } = await query.graph({ entity: "product", fields: ["id", "title"], filters: { id: itemProductIds } })
        for (const p of byId as any[]) {
          if (p.id)    existingProductIds.add(p.id)
          if (p.title) existingProductTitles.add(p.title)
        }
      }
      if (itemTitles.length > 0) {
        const { data: byTitle } = await query.graph({ entity: "product", fields: ["id", "title"], filters: { title: itemTitles } })
        for (const p of byTitle as any[]) {
          if (p.id)    existingProductIds.add(p.id)
          if (p.title) existingProductTitles.add(p.title)
        }
      }
    }

    /* ── Upsert DailyStat — always recorded regardless of product availability ── */
    const [existingDaily] = await analyticsService.listDailyStats({ date, currency_code: currency } as any)
    if (existingDaily) {
      await analyticsService.updateDailyStats({
        id: existingDaily.id,
        order_count: parseFloat(String(existingDaily.order_count)) + 1,
        revenue:     parseFloat(String(existingDaily.revenue)) + orderTotal,
      })
    } else {
      await analyticsService.createDailyStats({ date, order_count: 1, revenue: orderTotal, currency_code: currency })
    }

    /* ── Upsert ProductStat — only for items whose product still exists ────────── */
    for (const item of items) {
      const productId:    string = item.product_id ?? item.id
      const productTitle: string = item.product_title ?? item.title ?? ""

      const productExists =
        (productId    && existingProductIds.has(productId))    ||
        (productTitle && existingProductTitles.has(productTitle))

      if (!productExists) continue

      const variantId:    string = item.variant_id ?? item.id
      const variantTitle: string = item.variant_title ?? item.subtitle ?? null
      const qty:          number = safeNum(item.quantity)
      const lineRevenue:  number = safeNum(item.unit_price) * qty

      const [existingProduct] = await analyticsService.listProductStats({ date, variant_id: variantId, currency_code: currency } as any)
      if (existingProduct) {
        await analyticsService.updateProductStats({
          id:         existingProduct.id,
          units_sold: parseFloat(String(existingProduct.units_sold)) + qty,
          revenue:    parseFloat(String(existingProduct.revenue)) + lineRevenue,
        })
      } else {
        await analyticsService.createProductStats({
          date, product_id: productId, product_title: productTitle,
          variant_id: variantId, variant_title: variantTitle,
          units_sold: qty, revenue: lineRevenue, currency_code: currency,
        })
      }
    }

    /* ── Upsert CustomerStat — only for registered customers (has_account: true) ─ */
    const customerId: string | null = order.customer_id ?? order.customer?.id ?? null
    if (customerId && (order.customer as any)?.has_account === true) {
      const customer = order.customer as any
      const firstName = customer?.first_name ?? ""
      const lastName  = customer?.last_name  ?? ""

      const [existingCustomer] = await analyticsService.listCustomerStats({ date, customer_id: customerId, currency_code: currency } as any)
      if (existingCustomer) {
        await analyticsService.updateCustomerStats({
          id:          existingCustomer.id,
          order_count: parseFloat(String(existingCustomer.order_count)) + 1,
          revenue:     parseFloat(String(existingCustomer.revenue)) + orderTotal,
        })
      } else {
        await analyticsService.createCustomerStats({
          date, customer_id: customerId,
          customer_email: customer?.email ?? null,
          customer_name:  (firstName || lastName) ? `${firstName} ${lastName}`.trim() : null,
          order_count: 1, revenue: orderTotal, currency_code: currency,
        })
      }
    }

    return new StepResponse({ order_id: input.order_id, date })
  }
)

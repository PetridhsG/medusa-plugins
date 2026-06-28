/* Fires on order.canceled to subtract the order's contribution from pre-aggregated stats. */
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../modules/analytics"
import { safeNum, toDateString } from "../shared/bignumber"

export default async function orderCancelledAnalyticsSubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    const query: any = container.resolve(ContainerRegistrationKeys.QUERY)
    const analyticsService: any = container.resolve(ANALYTICS_MODULE)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id", "total", "currency_code", "created_at",
        "customer_id",
        "customer.id", "customer.has_account",
        "items.*",
      ],
      filters: { id: data.id },
    })

    const order = orders[0] as any
    if (!order) return

    const date     = toDateString(order.created_at)
    const currency = order.currency_code ?? "eur"
    const total    = safeNum(order.total)
    const items: any[] = order.items ?? []

    /* ── Subtract from DailyStat ── */
    const [daily] = await analyticsService.listDailyStats({ date, currency_code: currency } as any)
    if (daily) {
      const newCount   = Math.max(0, parseFloat(String(daily.order_count)) - 1)
      const newRevenue = Math.max(0, parseFloat(String(daily.revenue)) - total)
      if (newCount === 0) {
        await analyticsService.deleteDailyStats(daily.id)
      } else {
        await analyticsService.updateDailyStats({ id: daily.id, order_count: newCount, revenue: newRevenue })
      }
    }

    /* ── Subtract from ProductStat for each line item ── */
    for (const item of items) {
      const variantId   = item.variant_id ?? item.id
      const qty         = safeNum(item.quantity)
      const lineRevenue = safeNum(item.unit_price) * qty

      const [productStat] = await analyticsService.listProductStats({ date, variant_id: variantId, currency_code: currency } as any)
      if (!productStat) continue

      const newUnits   = Math.max(0, parseFloat(String(productStat.units_sold)) - qty)
      const newRevenue = Math.max(0, parseFloat(String(productStat.revenue)) - lineRevenue)
      if (newUnits === 0) {
        await analyticsService.deleteProductStats(productStat.id)
      } else {
        await analyticsService.updateProductStats({ id: productStat.id, units_sold: newUnits, revenue: newRevenue })
      }
    }

    /* ── Subtract from CustomerStat ── */
    const customerId: string | null = order.customer_id ?? order.customer?.id ?? null
    if (customerId && order.customer?.has_account === true) {
      const [customerStat] = await analyticsService.listCustomerStats({ date, customer_id: customerId, currency_code: currency } as any)
      if (customerStat) {
        const newCount   = Math.max(0, parseFloat(String(customerStat.order_count)) - 1)
        const newRevenue = Math.max(0, parseFloat(String(customerStat.revenue)) - total)
        if (newCount === 0) {
          await analyticsService.deleteCustomerStats(customerStat.id)
        } else {
          await analyticsService.updateCustomerStats({ id: customerStat.id, order_count: newCount, revenue: newRevenue })
        }
      }
    }

    logger.info(`[analytics] Reversed stats for cancelled order ${data.id}`)
  } catch (error: any) {
    logger.error(`[analytics] Failed to reverse stats for cancelled order ${data.id}: ${error?.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}

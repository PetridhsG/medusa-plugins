/* Fires on order.placed to upsert pre-aggregated analytics stats for the order. */
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import updateAnalyticsWorkflow from "../workflows/update-analytics"

export default async function orderAnalyticsSubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    await updateAnalyticsWorkflow(container).run({
      input: { order_id: data.id },
    })
    logger.info(`[analytics] Updated stats for order ${data.id}`)
  } catch (error: any) {
    logger.error(`[analytics] Failed to update stats for order ${data.id}: ${error?.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

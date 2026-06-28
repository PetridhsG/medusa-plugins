/* Pre-aggregated order count + revenue totals per calendar day per currency. */
import { model } from "@medusajs/framework/utils"

const DailyStat = model.define("analytics_daily_stat", {
  id: model.id().primaryKey(),
  date: model.text(), /* "YYYY-MM-DD" */
  order_count: model.number(),
  revenue: model.number(),
  currency_code: model.text(),
})

export default DailyStat

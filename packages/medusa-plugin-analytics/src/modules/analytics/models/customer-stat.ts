/* Pre-aggregated order count + revenue per registered customer per calendar day. */
import { model } from "@medusajs/framework/utils"

const CustomerStat = model.define("analytics_customer_stat", {
  id: model.id().primaryKey(),
  date: model.text(), /* "YYYY-MM-DD" */
  customer_id: model.text(),
  customer_email: model.text().nullable(),
  customer_name: model.text().nullable(),
  order_count: model.number(),
  revenue: model.number(),
  currency_code: model.text(),
})

export default CustomerStat

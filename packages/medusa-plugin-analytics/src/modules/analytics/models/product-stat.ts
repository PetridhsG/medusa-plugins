/* Pre-aggregated units-sold + revenue per product variant per calendar day. */
/* Stores product_title alongside product_id so stats survive product re-seeding */
/* (where the ID changes but the title stays the same). */
import { model } from "@medusajs/framework/utils"

const ProductStat = model.define("analytics_product_stat", {
  id: model.id().primaryKey(),
  date: model.text(), /* "YYYY-MM-DD" */
  product_id: model.text(),
  product_title: model.text(),
  variant_id: model.text().nullable(),
  variant_title: model.text().nullable(),
  units_sold: model.number(),
  revenue: model.number(),
  currency_code: model.text(),
})

export default ProductStat

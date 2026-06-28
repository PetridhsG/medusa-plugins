/* Data model for a locale translation of a product (title, subtitle, description). */
import { model } from "@medusajs/framework/utils"

const ProductTranslation = model.define("product_translation", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  locale: model.text(),
  title: model.text(),
  subtitle: model.text().nullable(),
  description: model.text().nullable(),
})

export default ProductTranslation

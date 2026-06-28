/* Stores translated titles for product variants per locale. */
import { model } from "@medusajs/framework/utils"

const ProductVariantTranslation = model.define("product_variant_translation", {
  id: model.id().primaryKey(),
  variant_id: model.text(),
  locale: model.text(),
  title: model.text(),
})

export default ProductVariantTranslation

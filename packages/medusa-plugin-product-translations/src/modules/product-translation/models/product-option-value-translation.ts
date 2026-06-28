/* Data model for a locale translation of a product option value. */
import { model } from "@medusajs/framework/utils"

const ProductOptionValueTranslation = model.define("product_option_value_translation", {
  id: model.id().primaryKey(),
  value_id: model.text(),
  locale: model.text(),
  value: model.text(),
})

export default ProductOptionValueTranslation

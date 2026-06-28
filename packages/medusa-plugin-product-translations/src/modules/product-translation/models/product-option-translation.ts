/* Data model for a locale translation of a product option title. */
import { model } from "@medusajs/framework/utils"

const ProductOptionTranslation = model.define("product_option_translation", {
  id: model.id().primaryKey(),
  option_id: model.text(),
  locale: model.text(),
  title: model.text(),
})

export default ProductOptionTranslation

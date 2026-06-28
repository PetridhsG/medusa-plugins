/* Data model for a locale translation of a product category. */
import { model } from "@medusajs/framework/utils"

const CategoryTranslation = model.define("category_translation", {
  id: model.id().primaryKey(),
  category_id: model.text(),
  locale: model.text(),
  title: model.text(),
  description: model.text().nullable(),
  thumbnail: model.text().nullable(),
})

export default CategoryTranslation

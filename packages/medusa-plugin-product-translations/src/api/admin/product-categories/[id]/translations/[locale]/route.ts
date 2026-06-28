/**
 * DELETE /admin/product-categories/:id/translations/:locale — remove a translation for a locale.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CATEGORY_TRANSLATION_MODULE } from "../../../../../../modules/category-translation"

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(CATEGORY_TRANSLATION_MODULE) as any

  const [existing] = await service.listCategoryTranslations({
    category_id: req.params.id,
    locale: req.params.locale,
  })

  if (existing) {
    await service.deleteCategoryTranslations([existing.id])
  }

  res.json({ success: true })
}

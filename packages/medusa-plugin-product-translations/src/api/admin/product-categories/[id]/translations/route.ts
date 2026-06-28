/**
 * GET  /admin/product-categories/:id/translations — list all locale translations for a category.
 * POST /admin/product-categories/:id/translations — upsert a translation for a given locale.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CATEGORY_TRANSLATION_MODULE } from "../../../../../modules/category-translation"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(CATEGORY_TRANSLATION_MODULE) as any
  const translations = await service.listCategoryTranslations({ category_id: req.params.id })
  res.json({ translations })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { locale, title, description } = req.body as {
    locale: string
    title: string
    description?: string | null
  }

  const service = req.scope.resolve(CATEGORY_TRANSLATION_MODULE) as any

  const [existing] = await service.listCategoryTranslations({
    category_id: req.params.id,
    locale,
  })

  if (existing) {
    await service.updateCategoryTranslations({ id: existing.id }, { title, description })
  } else {
    await service.createCategoryTranslations({ category_id: req.params.id, locale, title, description })
  }

  res.json({ success: true })
}

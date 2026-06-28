/* GET /store/category-translations?lang=en — returns all category translations for a locale. */
/* Pass locale via ?lang= query param or x-medusa-locale header. */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CATEGORY_TRANSLATION_MODULE } from "../../../modules/category-translation"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(CATEGORY_TRANSLATION_MODULE) as any
  const locale =
    (req.query.lang as string) ||
    (req.headers["x-medusa-locale"] as string) ||
    "en"

  const translations = await service.listCategoryTranslations({ locale })

  res.json({ translations })
}

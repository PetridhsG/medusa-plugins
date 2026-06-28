/* GET /store/option-titles?ids=opt_1,opt_2&lang=en — batch-fetch localized product option titles. */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_TRANSLATION_MODULE } from "../../../modules/product-translation"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const lang = (req.query.lang as string) || "en"
  const rawIds = (req.query.ids as string) || ""
  const ids = rawIds.split(",").map((s) => s.trim()).filter(Boolean)

  if (!ids.length) {
    return res.json({ titles: {} })
  }

  const titles: Record<string, string> = {}
  try {
    const service = req.scope.resolve(PRODUCT_TRANSLATION_MODULE) as any
    const translations = await service.listProductOptionTranslations({
      option_id: ids,
      locale: lang,
    })
    for (const t of translations) {
      if (t.title) titles[t.option_id] = t.title
    }
  } catch (e) {
    console.error("[option-titles] failed to fetch translations:", e)
  }

  return res.json({ titles })
}

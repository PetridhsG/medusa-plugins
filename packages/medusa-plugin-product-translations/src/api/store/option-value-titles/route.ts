/* GET /store/option-value-titles?ids=optval_1,optval_2&lang=en — batch-fetch localized option value labels. */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_TRANSLATION_MODULE } from "../../../modules/product-translation"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const lang = (req.query.lang as string) || "en"
  const rawIds = (req.query.ids as string) || ""
  const ids = rawIds.split(",").map((s) => s.trim()).filter(Boolean)

  if (!ids.length) {
    return res.json({ values: {} })
  }

  const values: Record<string, string> = {}
  try {
    const service = req.scope.resolve(PRODUCT_TRANSLATION_MODULE) as any
    const translations = await service.listProductOptionValueTranslations({
      value_id: ids,
      locale: lang,
    })
    for (const t of translations) {
      if (t.value) values[t.value_id] = t.value
    }
  } catch (e) {
    console.error("[option-value-titles] failed to fetch translations:", e)
  }

  return res.json({ values })
}

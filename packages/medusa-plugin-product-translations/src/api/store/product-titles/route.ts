/* GET /store/product-titles?ids=prod_1,prod_2&lang=en — batch-fetch localized title, subtitle, description. */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_TRANSLATION_MODULE } from "../../../modules/product-translation"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const lang = (req.query.lang as string) || "en"
  const rawIds = (req.query.ids as string) || ""
  const ids = rawIds.split(",").map((s) => s.trim()).filter(Boolean)

  if (!ids.length) {
    return res.json({ titles: {}, subtitles: {}, descriptions: {} })
  }

  const titles: Record<string, string> = {}
  const subtitles: Record<string, string> = {}
  const descriptions: Record<string, string> = {}

  try {
    const service = req.scope.resolve(PRODUCT_TRANSLATION_MODULE) as any
    const translations = await service.listProductTranslations({ product_id: ids, locale: lang })
    for (const t of translations) {
      if (t.title) titles[t.product_id] = t.title
      if (t.subtitle) subtitles[t.product_id] = t.subtitle
      if (t.description) descriptions[t.product_id] = t.description
    }
  } catch (e) {
    console.error("[product-titles] failed to fetch translations:", e)
  }

  return res.json({ titles, subtitles, descriptions })
}

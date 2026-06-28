/**
 * GET  /admin/products/:id/translations — fetch all translation data for a product
 *      (product fields + option names + option values) across all locales.
 * POST /admin/products/:id/translations — upsert a full translation for a locale,
 *      including product fields, option name overrides, and option value overrides.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_TRANSLATION_MODULE } from "../../../../../modules/product-translation"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(PRODUCT_TRANSLATION_MODULE) as any
  const productService = req.scope.resolve(Modules.PRODUCT) as any

  const translations = await service.listProductTranslations({ product_id: req.params.id })

  const product = await productService.retrieveProduct(req.params.id, {
    relations: ["options", "options.values", "variants"],
  })

  const optionIds = product.options?.map((o: any) => o.id) ?? []
  const valueIds = product.options?.flatMap((o: any) => o.values?.map((v: any) => v.id) ?? []) ?? []
  const variantIds = product.variants?.map((v: any) => v.id) ?? []

  const [optTrans, valTrans, variantTrans] = await Promise.all([
    optionIds.length ? service.listProductOptionTranslations({ option_id: optionIds }) : [],
    valueIds.length ? service.listProductOptionValueTranslations({ value_id: valueIds }) : [],
    variantIds.length ? service.listProductVariantTranslations({ variant_id: variantIds }) : [],
  ])

  res.json({ translations, option_translations: optTrans, value_translations: valTrans, variant_translations: variantTrans })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { locale, product, options = [], values = [], variants = [] } = req.body as {
    locale: string
    product: { title: string; subtitle?: string | null; description?: string | null }
    options: { option_id: string; title: string }[]
    values: { value_id: string; value: string }[]
    variants: { variant_id: string; title: string }[]
  }

  const service = req.scope.resolve(PRODUCT_TRANSLATION_MODULE) as any

  /* Upsert product-level translation */
  const [existing] = await service.listProductTranslations({ product_id: req.params.id, locale })
  if (existing) {
    await service.updateProductTranslations([{ id: existing.id, ...product }])
  } else {
    await service.createProductTranslations({ product_id: req.params.id, locale, ...product })
  }

  /* Upsert option translations */
  for (const opt of options) {
    const [ex] = await service.listProductOptionTranslations({ option_id: opt.option_id, locale })
    if (ex) {
      await service.updateProductOptionTranslations([{ id: ex.id, title: opt.title }])
    } else {
      await service.createProductOptionTranslations({ option_id: opt.option_id, locale, title: opt.title })
    }
  }

  /* Upsert option value translations */
  for (const val of values) {
    const [ex] = await service.listProductOptionValueTranslations({ value_id: val.value_id, locale })
    if (ex) {
      await service.updateProductOptionValueTranslations([{ id: ex.id, value: val.value }])
    } else {
      await service.createProductOptionValueTranslations({ value_id: val.value_id, locale, value: val.value })
    }
  }

  /* Upsert variant title translations */
  for (const variant of variants) {
    const [ex] = await service.listProductVariantTranslations({ variant_id: variant.variant_id, locale })
    if (ex) {
      await service.updateProductVariantTranslations([{ id: ex.id, title: variant.title }])
    } else {
      await service.createProductVariantTranslations({ variant_id: variant.variant_id, locale, title: variant.title })
    }
  }

  res.json({ success: true })
}

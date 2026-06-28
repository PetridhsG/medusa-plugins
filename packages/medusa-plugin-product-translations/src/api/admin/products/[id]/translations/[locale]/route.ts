/**
 * DELETE /admin/products/:id/translations/:locale — remove all translations for a locale
 *        (product fields, option names, option values, variant titles).
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_TRANSLATION_MODULE } from "../../../../../../modules/product-translation"

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(PRODUCT_TRANSLATION_MODULE) as any
  const productService = req.scope.resolve(Modules.PRODUCT) as any
  const { locale } = req.params

  const product = await productService.retrieveProduct(req.params.id, {
    relations: ["options", "options.values", "variants"],
  })

  const optionIds = product.options?.map((o: any) => o.id) ?? []
  const valueIds = product.options?.flatMap((o: any) => o.values?.map((v: any) => v.id) ?? []) ?? []
  const variantIds = product.variants?.map((v: any) => v.id) ?? []

  const [productTrans, optTrans, valTrans, variantTrans] = await Promise.all([
    service.listProductTranslations({ product_id: req.params.id, locale }),
    optionIds.length ? service.listProductOptionTranslations({ option_id: optionIds, locale }) : [],
    valueIds.length ? service.listProductOptionValueTranslations({ value_id: valueIds, locale }) : [],
    variantIds.length ? service.listProductVariantTranslations({ variant_id: variantIds, locale }) : [],
  ])

  await Promise.all([
    productTrans.length ? service.deleteProductTranslations(productTrans.map((t: any) => t.id)) : null,
    optTrans.length ? service.deleteProductOptionTranslations(optTrans.map((t: any) => t.id)) : null,
    valTrans.length ? service.deleteProductOptionValueTranslations(valTrans.map((t: any) => t.id)) : null,
    variantTrans.length ? service.deleteProductVariantTranslations(variantTrans.map((t: any) => t.id)) : null,
  ])

  res.json({ success: true })
}

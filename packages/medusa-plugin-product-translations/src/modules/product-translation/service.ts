/* CRUD service for product, variant, option, and option-value translations. */
import { MedusaService } from "@medusajs/framework/utils"
import ProductTranslation from "./models/product-translation"
import ProductOptionTranslation from "./models/product-option-translation"
import ProductOptionValueTranslation from "./models/product-option-value-translation"
import ProductVariantTranslation from "./models/product-variant-translation"

class ProductTranslationModuleService extends MedusaService({
  ProductTranslation,
  ProductOptionTranslation,
  ProductOptionValueTranslation,
  ProductVariantTranslation,
}) {}

export default ProductTranslationModuleService

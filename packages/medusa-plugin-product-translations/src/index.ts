/* Plugin entry point — re-exports module keys and default registrations for medusa-config.ts. */
export {
  PRODUCT_TRANSLATION_MODULE,
  default as ProductTranslationModule,
} from "./modules/product-translation"

export {
  CATEGORY_TRANSLATION_MODULE,
  default as CategoryTranslationModule,
} from "./modules/category-translation"

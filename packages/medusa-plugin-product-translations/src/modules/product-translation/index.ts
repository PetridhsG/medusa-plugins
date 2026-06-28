/* Registers the product-translation module. */
import { Module } from "@medusajs/framework/utils"
import ProductTranslationModuleService from "./service"

export const PRODUCT_TRANSLATION_MODULE = "productTranslation"

export default Module(PRODUCT_TRANSLATION_MODULE, { service: ProductTranslationModuleService })

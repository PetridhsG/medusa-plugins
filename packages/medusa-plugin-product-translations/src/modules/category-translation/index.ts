/* Registers the category-translation module. */
import { Module } from "@medusajs/framework/utils"
import CategoryTranslationModuleService from "./service"

export const CATEGORY_TRANSLATION_MODULE = "categoryTranslation"

export default Module(CATEGORY_TRANSLATION_MODULE, { service: CategoryTranslationModuleService })

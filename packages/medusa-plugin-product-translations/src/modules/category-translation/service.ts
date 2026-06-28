/* CRUD service for category translations. */
import { MedusaService } from "@medusajs/framework/utils"
import CategoryTranslation from "./models/category-translation"

class CategoryTranslationModuleService extends MedusaService({ CategoryTranslation }) {}

export default CategoryTranslationModuleService

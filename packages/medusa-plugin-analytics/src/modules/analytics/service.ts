/* CRUD service for analytics daily, product, and customer stat records. */
import { MedusaService } from "@medusajs/framework/utils"
import DailyStat from "./models/daily-stat"
import ProductStat from "./models/product-stat"
import CustomerStat from "./models/customer-stat"

class AnalyticsModuleService extends MedusaService({ DailyStat, ProductStat, CustomerStat }) {}

export default AnalyticsModuleService

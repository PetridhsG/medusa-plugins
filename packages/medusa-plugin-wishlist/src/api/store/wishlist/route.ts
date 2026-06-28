/**
 * GET  /store/wishlist — return the authenticated customer's wishlisted product IDs and basic product data.
 * POST /store/wishlist — add a product to the wishlist { product_id }.
 */
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../../modules/wishlist/index.js"
import WishlistModuleService from "../../../modules/wishlist/service.js"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const service: WishlistModuleService = req.scope.resolve(WISHLIST_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const items = await service.listWishlistItems({ customer_id: customerId })
  const productIds = items.map((i) => i.product_id)

  if (productIds.length === 0) {
    return res.json({ product_ids: [], products: [] })
  }

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productIds },
    fields: ["id", "title", "thumbnail", "handle", "status"],
  })

  res.json({ product_ids: productIds, products })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const { product_id } = req.body as { product_id: string }
  const service: WishlistModuleService = req.scope.resolve(WISHLIST_MODULE)

  const existing = await service.listWishlistItems({ customer_id: customerId, product_id })
  if (existing.length === 0) {
    await service.createWishlistItems({ customer_id: customerId, product_id })
  }

  res.json({ success: true })
}

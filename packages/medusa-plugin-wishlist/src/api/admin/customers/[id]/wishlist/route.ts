/**
 * GET  /admin/customers/:id/wishlist — list the products a customer has wishlisted.
 * POST /admin/customers/:id/wishlist — add a product to the customer's wishlist { product_id }.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../../../../modules/wishlist/index.js"
import WishlistModuleService from "../../../../../modules/wishlist/service.js"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: WishlistModuleService = req.scope.resolve(WISHLIST_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const items = await service.listWishlistItems({ customer_id: req.params.id })
  const productIds = items.map((i) => i.product_id)

  if (productIds.length === 0) {
    res.json({ products: [] })
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productIds },
    fields: ["id", "title", "thumbnail", "status"],
  })

  res.json({ products })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { product_id } = req.body as { product_id: string }
  const service: WishlistModuleService = req.scope.resolve(WISHLIST_MODULE)

  const existing = await service.listWishlistItems({
    customer_id: req.params.id,
    product_id,
  })

  if (existing.length === 0) {
    await service.createWishlistItems({ customer_id: req.params.id, product_id })
  }

  res.json({ success: true })
}

/* DELETE /store/wishlist/:product_id — remove a product from the authenticated customer's wishlist. */
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../modules/wishlist/index.js"
import WishlistModuleService from "../../../../modules/wishlist/service.js"

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const service: WishlistModuleService = req.scope.resolve(WISHLIST_MODULE)
  const existing = await service.listWishlistItems({
    customer_id: customerId,
    product_id: req.params.product_id,
  })

  if (existing.length > 0) {
    await service.deleteWishlistItems(existing.map((i) => i.id))
  }

  res.json({ success: true })
}

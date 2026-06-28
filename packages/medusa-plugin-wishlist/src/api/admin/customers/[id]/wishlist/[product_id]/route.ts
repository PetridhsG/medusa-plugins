/* DELETE /admin/customers/:id/wishlist/:product_id — remove a product from the customer's wishlist. */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { WISHLIST_MODULE } from "../../../../../../modules/wishlist/index.js"
import WishlistModuleService from "../../../../../../modules/wishlist/service.js"

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: WishlistModuleService = req.scope.resolve(WISHLIST_MODULE)

  const existing = await service.listWishlistItems({
    customer_id: req.params.id,
    product_id: req.params.product_id,
  })

  if (existing.length > 0) {
    await service.deleteWishlistItems(existing.map((i) => i.id))
  }

  res.json({ success: true })
}

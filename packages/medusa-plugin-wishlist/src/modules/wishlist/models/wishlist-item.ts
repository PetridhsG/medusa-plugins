/* Data model for a single wishlisted product belonging to a customer. */
/* One row per (customer, product) pair — enforced by a unique index. */
import { model } from "@medusajs/framework/utils"

const WishlistItem = model
  .define("wishlist_item", {
    id: model.id().primaryKey(),
    customer_id: model.text(),
    product_id: model.text(),
  })
  .indexes([{ on: ["customer_id", "product_id"], unique: true }])

export default WishlistItem

# medusa-plugin-wishlist

Customer product wishlist for **Medusa v2**.

Adds a per-customer wishlist backed by a `wishlist_item` table with a unique constraint on `(customer_id, product_id)`. Includes store routes for authenticated customers and admin routes for managing wishlists on behalf of any customer.

---

## Features

- Add and remove products from a wishlist
- Unique constraint prevents duplicate entries
- Store routes use Medusa's JWT auth — no custom auth logic needed
- Admin routes let you view and manage any customer's wishlist
- Fetches full product data (title, thumbnail, handle, status) via Medusa's query graph

---

## Requirements

- Medusa `>=2.14.0`
- Node `>=20`
- PostgreSQL

---

## Installation

```bash
npm install @petridhsg/medusa-plugin-wishlist
# or
pnpm add @petridhsg/medusa-plugin-wishlist
```

---

## Setup

### 1. Register in `medusa-config.ts`

Both entries are required: `plugins` loads the API routes; `modules` registers the database module.

```ts
import { defineConfig } from "@medusajs/framework/config"
import { WishlistModule } from "@petridhsg/medusa-plugin-wishlist"

export default defineConfig({
  plugins: [
    { resolve: "@petridhsg/medusa-plugin-wishlist" },
  ],

  modules: [
    { resolve: WishlistModule },
  ],
})
```

### 2. Run migrations

```bash
npx medusa db:migrate
```

Creates the `wishlist_item` table:

| Column | Type | Description |
|---|---|---|
| `id` | text | Primary key |
| `customer_id` | text | Medusa customer ID |
| `product_id` | text | Medusa product ID |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz | Soft delete |

A partial unique index on `(customer_id, product_id) WHERE deleted_at IS NULL` prevents duplicate entries.

---

## API Reference

### Store Routes

Require a logged-in customer. Pass the Medusa JWT in the `Authorization: Bearer <token>` header.

**`GET /store/wishlist`**

Returns the authenticated customer's wishlist with full product details.

```json
{
  "product_ids": ["prod_01", "prod_02"],
  "products": [
    { "id": "prod_01", "title": "...", "thumbnail": "...", "handle": "...", "status": "published" }
  ]
}
```

**`POST /store/wishlist`**

Add a product. Idempotent — adding an already-wishlisted product is a no-op.

```json
{ "product_id": "prod_01" }
```

**`DELETE /store/wishlist/:product_id`**

Remove a product from the wishlist.

---

### Admin Routes

Standard Medusa admin authentication.

**`GET /admin/customers/:id/wishlist`**

Returns a customer's wishlisted products.

**`POST /admin/customers/:id/wishlist`**

Add a product to a customer's wishlist.

```json
{ "product_id": "prod_01" }
```

**`DELETE /admin/customers/:id/wishlist/:product_id`**

Remove a product from a customer's wishlist.

---

## Storefront usage

```ts
const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }

// Fetch wishlist
const { products } = await fetch("/store/wishlist", { headers }).then(r => r.json())

// Add to wishlist
await fetch("/store/wishlist", {
  method: "POST",
  headers,
  body: JSON.stringify({ product_id: "prod_01" }),
})

// Remove from wishlist
await fetch("/store/wishlist/prod_01", { method: "DELETE", headers })
```

---

## License

MIT

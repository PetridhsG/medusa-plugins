# medusa-plugins

A collection of open-source plugins for [Medusa v2](https://medusajs.com) (≥ 2.14.0).

---

## Plugins

### [`@petridhsg/medusa-plugin-product-translations`](packages/medusa-plugin-product-translations)

Per-locale translations for products, variants, options, option values, and categories — stored in the database and served through dedicated store and admin REST endpoints.

**Features**
- Translate product title, subtitle, description, variant titles, option names, and option values
- Translate category title and description
- Admin API for managing translations
- Store API for fetching translated content by `?lang=` query param

---

### [`@petridhsg/medusa-plugin-wishlist`](packages/medusa-plugin-wishlist)

Customer wishlists with full store and admin REST API.

**Features**
- Customers can add/remove products from their wishlist (authenticated store routes)
- Product data resolved at read time via Medusa's `query.graph`
- Admin API to view and manage any customer's wishlist
- Unique constraint prevents duplicate entries per customer + product

---

### [`@petridhsg/medusa-plugin-analytics`](packages/medusa-plugin-analytics)

Pre-aggregated order analytics — daily revenue, top products, and customer stats — without hitting raw order tables on every dashboard load.

**Features**
- Stats recorded automatically on `order.placed` (no manual "complete order" step required)
- Cancelled orders are automatically compensated via `order.canceled` subscriber
- Dashboard endpoint with overview, time series, top products, category breakdown, top customers
- Per-product, per-variant, and per-customer drilldown endpoints
- `POST /admin/analytics/recalculate` to rebuild stats from scratch

---

### [`@petridhsg/medusa-plugin-email-templates`](packages/medusa-plugin-email-templates)

Database-backed [Handlebars](https://handlebarsjs.com) email templates with pluggable delivery providers.

**Features**
- Store and edit email templates (subject + HTML body) from the database — no redeployment needed
- Handlebars rendering with any custom variables
- Pluggable delivery: **Resend** or any **SMTP server** (Postmark, SendGrid, Mailgun, self-hosted)
- Dev redirect — send all emails to a test address outside production
- Admin API for full template CRUD and delivery testing

---

## Installation

Each plugin is a standalone npm package. Install only the ones you need:

```bash
npm install @petridhsg/medusa-plugin-product-translations
npm install @petridhsg/medusa-plugin-wishlist
npm install @petridhsg/medusa-plugin-analytics
npm install @petridhsg/medusa-plugin-email-templates resend      # or nodemailer for SMTP
```

Then register the modules in your `medusa-config.ts` and run `npx medusa db:migrate`. See each plugin's README for the full setup guide.

---

## Compatibility

| Plugin | Medusa version |
|---|---|
| All plugins | ≥ 2.14.0 |

---

## Development

This repo is a [pnpm](https://pnpm.io) workspace.

```bash
pnpm install       # install all dependencies
pnpm build         # build all plugins
```

---

## License

MIT © [Giannis Petridakos](https://github.com/PetridhsG)

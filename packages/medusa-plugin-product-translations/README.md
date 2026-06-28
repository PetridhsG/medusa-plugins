# medusa-plugin-product-translations

Product and category i18n translations for **Medusa v2**.

Stores locale-aware translations for products, variants, options, option values, and categories in the database. Includes admin routes for managing translations and store routes for fetching translated content — no extra setup required in your storefront beyond calling the endpoints.

---

## Features

- Translate **product** title, subtitle, and description per locale
- Translate **variant** titles per locale
- Translate **option** names per locale (e.g. "Color" → "Farbe")
- Translate **option values** per locale (e.g. "Red" → "Rot")
- Translate **category** title and description per locale
- Admin routes to manage all translations
- Store routes to batch-fetch translations by ID and `?lang=` param

---

## Requirements

- Medusa `>=2.14.0`
- Node `>=20`
- PostgreSQL

---

## Installation

```bash
pnpm add @petridhsg/medusa-plugin-product-translations
# or
pnpm add @petridhsg/medusa-plugin-product-translations
```

---

## Setup

### 1. Register in `medusa-config.ts`

Both entries are required: `plugins` loads the API routes; `modules` registers the two database modules (products and categories are separate modules so you can use only one if needed).

```ts
import { defineConfig } from "@medusajs/framework/config"
import {
  ProductTranslationModule,
  CategoryTranslationModule,
} from "@petridhsg/medusa-plugin-product-translations"

export default defineConfig({
  plugins: [
    { resolve: "@petridhsg/medusa-plugin-product-translations" },
  ],

  modules: [
    { resolve: ProductTranslationModule },
    { resolve: CategoryTranslationModule },
  ],
})
```

### 2. Run migrations

```bash
npx medusa db:migrate
```

Creates the following tables:

| Table | Description |
|---|---|
| `product_translation` | Product title, subtitle, description per locale |
| `product_variant_translation` | Variant title per locale |
| `product_option_translation` | Option name per locale |
| `product_option_value_translation` | Option value per locale |
| `category_translation` | Category title and description per locale |

---

## API Reference

### Admin Routes

All admin routes require authentication.

#### Products

**`GET /admin/products/:id/translations`**

Returns all translations for a product across all locales, including options, option values, and variants.

```json
{
  "translations": [{ "id": "...", "product_id": "prod_01", "locale": "de", "title": "..." }],
  "option_translations": [{ "option_id": "opt_01", "locale": "de", "title": "Farbe" }],
  "value_translations": [{ "value_id": "optval_01", "locale": "de", "value": "Rot" }],
  "variant_translations": [{ "variant_id": "variant_01", "locale": "de", "title": "Rot / L" }]
}
```

**`POST /admin/products/:id/translations`**

Upserts a full translation set for a locale. All fields are optional except `locale`.

```json
{
  "locale": "de",
  "product": { "title": "Baumwoll-T-Shirt", "subtitle": "Klassischer Schnitt", "description": "100% Bio-Baumwolle" },
  "options": [{ "option_id": "opt_01", "title": "Farbe" }],
  "values": [{ "value_id": "optval_01", "value": "Rot" }],
  "variants": [{ "variant_id": "variant_01", "title": "Rot / L" }]
}
```

**`DELETE /admin/products/:id/translations/:locale`**

Removes all translations for a product in the given locale.

---

#### Categories

**`GET /admin/product-categories/:id/translations`**

Returns all locale translations for a category.

```json
{
  "translations": [{ "id": "...", "category_id": "cat_01", "locale": "de", "title": "Kleidung" }]
}
```

**`POST /admin/product-categories/:id/translations`**

Upserts a translation for a locale.

```json
{
  "locale": "de",
  "title": "Kleidung",
  "description": "Alle Bekleidungsartikel"
}
```

**`DELETE /admin/product-categories/:id/translations/:locale`**

Removes the translation for a category in the given locale.

---

### Store Routes

No authentication required.

**`GET /store/product-titles?ids=prod_01,prod_02&lang=de`**

Batch-fetch localized product titles, subtitles, and descriptions.

```json
{
  "titles": { "prod_01": "Baumwoll-T-Shirt" },
  "subtitles": { "prod_01": "Klassischer Schnitt" },
  "descriptions": { "prod_01": "100% Bio-Baumwolle" }
}
```

**`GET /store/option-titles?ids=opt_01,opt_02&lang=de`**

Batch-fetch localized option names.

```json
{ "titles": { "opt_01": "Farbe" } }
```

**`GET /store/option-value-titles?ids=optval_01,optval_02&lang=de`**

Batch-fetch localized option values.

```json
{ "values": { "optval_01": "Rot" } }
```

**`GET /store/category-translations?lang=de`**

Returns all category translations for the given locale.

```json
{
  "translations": [{ "category_id": "cat_01", "locale": "de", "title": "Kleidung" }]
}
```

---

## Storefront usage pattern

```ts
// 1. Fetch products from Medusa
const { products } = await fetch("/store/products").then(r => r.json())

// 2. Collect IDs
const productIds = products.map(p => p.id).join(",")
const optionIds  = products.flatMap(p => p.options.map(o => o.id)).join(",")
const valueIds   = products.flatMap(p => p.options.flatMap(o => o.values.map(v => v.id))).join(",")

// 3. Fetch translations in parallel
const [titles, options, values] = await Promise.all([
  fetch(`/store/product-titles?ids=${productIds}&lang=de`).then(r => r.json()),
  fetch(`/store/option-titles?ids=${optionIds}&lang=de`).then(r => r.json()),
  fetch(`/store/option-value-titles?ids=${valueIds}&lang=de`).then(r => r.json()),
])

// 4. Merge over product data
const translated = products.map(p => ({
  ...p,
  title:       titles.titles[p.id]       ?? p.title,
  description: titles.descriptions[p.id] ?? p.description,
  options: p.options.map(o => ({
    ...o,
    title: options.titles[o.id] ?? o.title,
    values: o.values.map(v => ({ ...v, value: values.values[v.id] ?? v.value })),
  })),
}))
```

---

## License

MIT

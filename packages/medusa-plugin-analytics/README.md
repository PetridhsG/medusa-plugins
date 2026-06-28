# medusa-plugin-analytics

Pre-aggregated order analytics for **Medusa v2**.

Tracks daily revenue, top products, and customer stats in three lightweight tables and exposes a full admin dashboard API — no raw SQL or external BI tool required. Stats update automatically when an order is placed and are corrected automatically if the order is later cancelled.

---

## Features

- **Daily stats** — order count + revenue per day per currency
- **Product stats** — units sold + revenue per variant per day (survives product re-seeding)
- **Customer stats** — order count + revenue per registered customer per day
- **Dashboard route** — overview, time series, top products, category stats, top customers, order status breakdown
- **Per-product drilldown** — time series + overview for a single product
- **Per-customer drilldown** — time series + overview for a single customer
- **Category drilldown** — time series + top products for a category
- **Variant breakdown** — units + revenue per variant for a product
- **Recalculate** — rebuild all stats from scratch (useful after data migrations)
- Fires on `order.placed` — works for all payment methods including COD, no manual "complete order" step needed
- Automatically subtracts cancelled orders via `order.canceled` subscriber

---

## Requirements

- Medusa `>=2.14.0`
- Node `>=20`
- PostgreSQL

---

## Installation

```bash
npm install @petridhsg/medusa-plugin-analytics
# or
pnpm add @petridhsg/medusa-plugin-analytics
```

---

## Setup

### 1. Register in `medusa-config.ts`

Both entries are required: `plugins` loads the API routes and subscribers; `modules` registers the database module.

```ts
import { defineConfig } from "@medusajs/framework/config"
import { AnalyticsModule } from "@petridhsg/medusa-plugin-analytics"

export default defineConfig({
  plugins: [
    { resolve: "@petridhsg/medusa-plugin-analytics" },
  ],

  modules: [
    { resolve: AnalyticsModule },
  ],
})
```

### 2. Run migrations

```bash
npx medusa db:migrate
```

Creates three tables:

| Table | Description |
|---|---|
| `analytics_daily_stat` | Order count + revenue per day per currency |
| `analytics_product_stat` | Units sold + revenue per variant per day |
| `analytics_customer_stat` | Order count + revenue per registered customer per day |

---

## How it works

When an order is placed the `order.placed` subscriber runs the `update-analytics` workflow, which upserts records in all three stat tables. If the order is later cancelled, the `order.canceled` subscriber automatically subtracts its contribution from the aggregates.

Use `POST /admin/analytics/recalculate` to do a full wipe-and-rebuild if stats ever get out of sync.

**Product re-seeding resilience:** stats store both `product_id` and `product_title`. Queries prefer title-based matching so stats survive catalog resets where product IDs change but titles remain the same.

---

## API Reference

All routes require standard Medusa admin authentication.

### `GET /admin/analytics`

Full dashboard for the selected period.

**Query params:**

| Param | Values | Default | Description |
|---|---|---|---|
| `period` | `week` `month` `year` `all` | `month` | Time window |
| `week_start` | `YYYY-MM-DD` | current week | Monday of the week (`period=week` only) |
| `month` | `YYYY-MM` | current month | Target month (`period=month` only) |
| `year` | `YYYY` | current year | Target year (`period=year` only) |

**Response:**

```json
{
  "overview": { "total_orders": 42, "total_revenue": 1890.50, "avg_order_value": 45.01, "currency_code": "eur" },
  "time_series": [{ "period": "2024-06", "orders": 42, "revenue": 1890.50 }],
  "top_products": [{ "product_id": "...", "product_title": "...", "units_sold": 18, "revenue": 810.00 }],
  "category_stats": [{ "category_id": "...", "category_name": "...", "units_sold": 18, "revenue": 810.00 }],
  "top_customers": [{ "customer_id": "...", "customer_email": "...", "order_count": 3, "revenue": 135.00 }],
  "status_counts": { "pending": 3, "canceled": 1 },
  "period": "month",
  "date_range": { "from": "2024-06-01", "to": "2024-06-28" }
}
```

---

### `GET /admin/analytics/product-stats?product_id=X&period=month`

Time-series and overview for a single product.

```json
{
  "overview": { "units_sold": 18, "revenue": 810.00, "currency_code": "eur" },
  "time_series": [{ "period": "2024-W23", "units_sold": 5, "revenue": 225.00 }],
  "period": "month",
  "date_range": { "from": "2024-06-01", "to": "2024-06-28" }
}
```

---

### `GET /admin/analytics/customer-stats?customer_id=X&period=month`

Time-series and overview for a single customer.

```json
{
  "overview": { "order_count": 3, "revenue": 135.00, "avg_order_value": 45.00, "currency_code": "eur" },
  "time_series": [{ "period": "2024-W23", "orders": 1, "revenue": 45.00 }],
  "period": "month",
  "date_range": { "from": "2024-06-01", "to": "2024-06-28" }
}
```

---

### `GET /admin/analytics/category-stats?category_id=X&period=month`

Time-series, overview, and top products for a single category.

---

### `GET /admin/analytics/variants?product_id=X&period=month`

Variant-level sales breakdown for a single product.

```json
{
  "variants": [{ "variant_id": "...", "variant_title": "Red / L", "units_sold": 7, "revenue": 315.00 }]
}
```

---

### `POST /admin/analytics/recalculate`

Wipes all stats and rebuilds them from every non-cancelled order. Use after data migrations or to correct any drift.

```json
{
  "success": true,
  "orders_processed": 348,
  "daily_records": 92,
  "product_records": 1840,
  "customer_records": 210,
  "items_skipped": 12
}
```

---

## License

MIT

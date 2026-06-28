/* Creates analytics_daily_stat, analytics_product_stat, and analytics_customer_stat tables. */
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class CreateAnalyticsMigration extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "analytics_daily_stat" (
      "id"            text        not null,
      "date"          text        not null,
      "order_count"   integer     not null,
      "revenue"       numeric     not null,
      "currency_code" text        not null,
      "created_at"    timestamptz not null default now(),
      "updated_at"    timestamptz not null default now(),
      "deleted_at"    timestamptz null,
      constraint "analytics_daily_stat_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_daily_stat_deleted_at" ON "analytics_daily_stat" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "analytics_product_stat" (
      "id"            text        not null,
      "date"          text        not null,
      "product_id"    text        not null,
      "product_title" text        not null,
      "variant_id"    text        null,
      "variant_title" text        null,
      "units_sold"    integer     not null,
      "revenue"       numeric     not null,
      "currency_code" text        not null,
      "created_at"    timestamptz not null default now(),
      "updated_at"    timestamptz not null default now(),
      "deleted_at"    timestamptz null,
      constraint "analytics_product_stat_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_product_stat_deleted_at" ON "analytics_product_stat" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "analytics_customer_stat" (
      "id"             text        not null,
      "date"           text        not null,
      "customer_id"    text        not null,
      "customer_email" text        null,
      "customer_name"  text        null,
      "order_count"    integer     not null,
      "revenue"        numeric     not null,
      "currency_code"  text        not null,
      "created_at"     timestamptz not null default now(),
      "updated_at"     timestamptz not null default now(),
      "deleted_at"     timestamptz null,
      constraint "analytics_customer_stat_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_customer_stat_deleted_at" ON "analytics_customer_stat" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_customer_stat_customer_id" ON "analytics_customer_stat" ("customer_id") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "analytics_daily_stat" cascade;`)
    this.addSql(`drop table if exists "analytics_product_stat" cascade;`)
    this.addSql(`drop table if exists "analytics_customer_stat" cascade;`)
  }

}

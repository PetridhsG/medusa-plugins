/* Creates product, variant, option, and option-value translation tables for i18n support. */
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class CreateProductTranslationMigration extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_option_translation" (
      "id" text not null,
      "option_id" text not null,
      "locale" text not null,
      "title" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "product_option_translation_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_option_translation_deleted_at" ON "product_option_translation" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "product_option_value_translation" (
      "id" text not null,
      "value_id" text not null,
      "locale" text not null,
      "value" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "product_option_value_translation_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_option_value_translation_deleted_at" ON "product_option_value_translation" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "product_translation" (
      "id" text not null,
      "product_id" text not null,
      "locale" text not null,
      "title" text not null,
      "subtitle" text null,
      "description" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "product_translation_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_translation_deleted_at" ON "product_translation" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "product_variant_translation" (
      "id" text not null,
      "variant_id" text not null,
      "locale" text not null,
      "title" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "product_variant_translation_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_translation_deleted_at" ON "product_variant_translation" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_option_translation" cascade;`)
    this.addSql(`drop table if exists "product_option_value_translation" cascade;`)
    this.addSql(`drop table if exists "product_translation" cascade;`)
    this.addSql(`drop table if exists "product_variant_translation" cascade;`)
  }

}

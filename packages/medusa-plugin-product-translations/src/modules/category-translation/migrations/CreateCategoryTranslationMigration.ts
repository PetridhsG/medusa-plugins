/* Creates category_translation table for i18n support. */
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class CreateCategoryTranslationMigration extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "category_translation" (
      "id" text not null,
      "category_id" text not null,
      "locale" text not null,
      "title" text not null,
      "description" text null,
      "thumbnail" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "category_translation_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_translation_deleted_at" ON "category_translation" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "category_translation" cascade;`)
  }

}

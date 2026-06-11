import { MigrationInterface, QueryRunner } from 'typeorm';

export class BudgetItemNewFieldsAndExchangeRate1780900000000 implements MigrationInterface {
  name = 'BudgetItemNewFieldsAndExchangeRate1780900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------
    // 1. Create new enum types
    // ------------------------------------------------------------------

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'holiday_enum'
        ) THEN
          CREATE TYPE "holiday_enum"
          AS ENUM (
            'PASSOVER',
            'ROSH_HASHANA',
            'YOM_KIPPUR',
            'SUKKOT',
            'HANUKKAH',
            'PURIM',
            'SHAVUOT',
            'TU_BISHVAT'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'currency_code_enum'
        ) THEN
          CREATE TYPE "currency_code_enum"
          AS ENUM ('ILS', 'USD', 'EUR', 'GBP');
        END IF;
      END$$;
    `);

    // ------------------------------------------------------------------
    // 2. Rename is_cleared → needs_review and invert value
    // ------------------------------------------------------------------

    await queryRunner.query(
      `ALTER TABLE "budget_item" RENAME COLUMN "is_cleared" TO "needs_review"`,
    );
    await queryRunner.query(
      `UPDATE "budget_item" SET "needs_review" = NOT "needs_review"`,
    );

    // ------------------------------------------------------------------
    // 3. Add new columns to budget_item
    // ------------------------------------------------------------------

    await queryRunner.query(
      `ALTER TABLE "budget_item" ADD COLUMN IF NOT EXISTS "target_amount" DECIMAL(18,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" ADD COLUMN IF NOT EXISTS "assigned_month" INT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" ADD COLUMN IF NOT EXISTS "base_month" INT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" ADD COLUMN IF NOT EXISTS "holiday" "holiday_enum" NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" ADD COLUMN IF NOT EXISTS "is_one_time" BOOLEAN NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" ADD COLUMN IF NOT EXISTS "currency" "currency_code_enum" NOT NULL DEFAULT 'ILS'`,
    );

    // ------------------------------------------------------------------
    // 4. Add check constraints for month ranges
    // ------------------------------------------------------------------

    await queryRunner.query(`
      ALTER TABLE "budget_item"
        ADD CONSTRAINT "CHK_budget_item_assigned_month"
          CHECK ("assigned_month" IS NULL OR ("assigned_month" >= 1 AND "assigned_month" <= 12)),
        ADD CONSTRAINT "CHK_budget_item_base_month"
          CHECK ("base_month" IS NULL OR ("base_month" >= 1 AND "base_month" <= 12))
    `);

    // ------------------------------------------------------------------
    // 5. Create exchange_rate table
    // ------------------------------------------------------------------

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exchange_rate" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "currency"    "currency_code_enum" NOT NULL,
        "rate_to_ils" DECIMAL(18,6) NOT NULL,
        "rate_date"   DATE        NOT NULL,
        "created_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exchange_rate" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exchange_rate_currency_date" UNIQUE ("currency", "rate_date")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------
    // 1. Drop exchange_rate table
    // ------------------------------------------------------------------

    await queryRunner.query(`DROP TABLE IF EXISTS "exchange_rate"`);

    // ------------------------------------------------------------------
    // 2. Drop check constraints
    // ------------------------------------------------------------------

    await queryRunner.query(`
      ALTER TABLE "budget_item"
        DROP CONSTRAINT IF EXISTS "CHK_budget_item_assigned_month",
        DROP CONSTRAINT IF EXISTS "CHK_budget_item_base_month"
    `);

    // ------------------------------------------------------------------
    // 3. Remove columns added in up()
    // ------------------------------------------------------------------

    await queryRunner.query(
      `ALTER TABLE "budget_item" DROP COLUMN IF EXISTS "currency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" DROP COLUMN IF EXISTS "is_one_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" DROP COLUMN IF EXISTS "holiday"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" DROP COLUMN IF EXISTS "base_month"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" DROP COLUMN IF EXISTS "assigned_month"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" DROP COLUMN IF EXISTS "target_amount"`,
    );

    // ------------------------------------------------------------------
    // 4. Revert needs_review → is_cleared (invert back)
    // ------------------------------------------------------------------

    await queryRunner.query(
      `UPDATE "budget_item" SET "needs_review" = NOT "needs_review"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_item" RENAME COLUMN "needs_review" TO "is_cleared"`,
    );

    // ------------------------------------------------------------------
    // 5. Drop enum types (only if no other table references them)
    // ------------------------------------------------------------------

    await queryRunner.query(`DROP TYPE IF EXISTS "currency_code_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "holiday_enum"`);
  }
}

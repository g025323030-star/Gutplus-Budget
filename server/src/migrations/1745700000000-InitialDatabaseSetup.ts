import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDatabaseSetup1745700000000 implements MigrationInterface {
  name = 'InitialDatabaseSetup1745700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types
    await queryRunner.query(`
      CREATE TYPE "family_member_role_enum" AS ENUM ('Parent', 'Child')
    `);
    await queryRunner.query(`
      CREATE TYPE "account_type_enum" AS ENUM
      ('BANK', 'CREDIT_CARD', 'ASSET', 'LOAN', 'MORTGAGE')
    `);
    await queryRunner.query(`
      CREATE TYPE "category_type_enum" AS ENUM ('INCOME', 'EXPENSE')
    `);
    await queryRunner.query(`
      CREATE TYPE "category_frequency_enum" AS ENUM ('MONTHLY', 'YEARLY')
    `);

    // household
    await queryRunner.query(`
      CREATE TABLE "household" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "family_size" int NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // family_member
    await queryRunner.query(`
      CREATE TABLE "family_member" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "role" "family_member_role_enum" NOT NULL,
        "household_id" uuid NOT NULL
          REFERENCES "household"("id") ON DELETE CASCADE
      )
    `);

    // category (materialized-path tree managed by TypeORM via "mpath")
    await queryRunner.query(`
      CREATE TABLE "category" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "type" "category_type_enum" NOT NULL,
        "frequency" "category_frequency_enum" NOT NULL,
        "mpath" varchar DEFAULT '',
        "household_id" uuid
          REFERENCES "household"("id") ON DELETE CASCADE,
        "parent_category_id" uuid
          REFERENCES "category"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // account
    await queryRunner.query(`
      CREATE TABLE "account" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "type" "account_type_enum" NOT NULL,
        "balance" decimal(18,2) NOT NULL DEFAULT 0,
        "currency" varchar(3) NOT NULL DEFAULT 'ILS',
        "monthly_payment" decimal(18,2),
        "interest_rate" decimal(5,2),
        "urgency_level" int NOT NULL,
        "household_id" uuid NOT NULL
          REFERENCES "household"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // budget_plan
    await queryRunner.query(`
      CREATE TABLE "budget_plan" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "amount" decimal(18,2) NOT NULL,
        "month" int NOT NULL,
        "year" int NOT NULL,
        "household_id" uuid NOT NULL
          REFERENCES "household"("id") ON DELETE CASCADE,
        "category_id" uuid
          REFERENCES "category"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_budget_plan_month"
          CHECK ("month" BETWEEN 1 AND 12)
      )
    `);

    // transaction
    await queryRunner.query(`
      CREATE TABLE "transaction" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "amount" decimal(18,2) NOT NULL,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "description" text NOT NULL,
        "is_cleared" boolean NOT NULL DEFAULT false,
        "household_id" uuid NOT NULL
          REFERENCES "household"("id") ON DELETE CASCADE,
        "category_id" uuid
          REFERENCES "category"("id") ON DELETE SET NULL,
        "account_id" uuid
          REFERENCES "account"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_family_member_household"
      ON "family_member" ("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_category_household"
      ON "category" ("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_category_parent"
      ON "category" ("parent_category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_account_household"
      ON "account" ("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_budget_plan_household"
      ON "budget_plan" ("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_budget_plan_category"
      ON "budget_plan" ("category_id")
    `);
    // Partial unique indexes: ensure one budget_plan per
    // (household, year, month) for each category — including the
    // "uncategorized" bucket where category_id IS NULL.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_budget_plan_with_category"
      ON "budget_plan" ("household_id", "category_id", "year", "month")
      WHERE "category_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_budget_plan_without_category"
      ON "budget_plan" ("household_id", "year", "month")
      WHERE "category_id" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_household"
      ON "transaction" ("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_category"
      ON "transaction" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_account"
      ON "transaction" ("account_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_date"
      ON "transaction" ("date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_account"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_category"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transaction_household"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_budget_plan_without_category"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_budget_plan_with_category"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_budget_plan_category"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_budget_plan_household"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_account_household"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_household"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_family_member_household"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "transaction"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_plan"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "account"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "family_member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "household"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "category_frequency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "category_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "account_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "family_member_role_enum"`);
  }
}

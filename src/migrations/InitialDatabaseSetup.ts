import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDatabaseSetup1700000000000 implements MigrationInterface {
  name = 'InitialDatabaseSetup1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create household table
    await queryRunner.query(`
      CREATE TABLE "household" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "family_size" int NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create family_member table
    await queryRunner.query(`
      CREATE TABLE "family_member" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "role" varchar NOT NULL,
        "household_id" uuid REFERENCES "household"("id") ON DELETE CASCADE
      )
    `);

    // Create category table (with materialized-path tree)
    await queryRunner.query(`
      CREATE TABLE "category" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "type" varchar NOT NULL,
        "frequency" varchar NOT NULL,
        "household_id" uuid REFERENCES "household"("id") ON DELETE SET NULL,
        "parent_id" uuid REFERENCES "category"("id") ON DELETE SET NULL,
        "materialized_path" varchar NOT NULL
      )
    `);

    // Create account table
    await queryRunner.query(`
      CREATE TABLE "account" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "type" varchar NOT NULL,
        "balance" decimal(18,2) NOT NULL DEFAULT 0,
        "currency" varchar(3) NOT NULL DEFAULT 'ILS',
        "monthly_payment" decimal(18,2),
        "interest_rate" decimal(5,2),
        "urgency_level" int NOT NULL,
        "household_id" uuid REFERENCES "household"("id") ON DELETE CASCADE
      )
    `);

    // Create budget_plan table
    await queryRunner.query(`
      CREATE TABLE "budget_plan" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "amount" decimal(18,2) NOT NULL,
        "month" int NOT NULL,
        "year" int NOT NULL,
        "household_id" uuid REFERENCES "household"("id") ON DELETE CASCADE,
        "category_id" uuid REFERENCES "category"("id") ON DELETE SET NULL
      )
    `);

    // Create transaction table
    await queryRunner.query(`
      CREATE TABLE "transaction" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "amount" decimal(18,2) NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "description" text NOT NULL,
        "is_cleared" boolean NOT NULL DEFAULT false,
        "household_id" uuid REFERENCES "household"("id") ON DELETE CASCADE,
        "category_id" uuid REFERENCES "category"("id") ON DELETE SET NULL,
        "account_id" uuid REFERENCES "account"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_family_member_household" ON "family_member"("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_category_household" ON "category"("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_category_parent" ON "category"("parent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_account_household" ON "account"("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_budget_plan_household" ON "budget_plan"("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_budget_plan_category" ON "budget_plan"("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_household" ON "transaction"("household_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_category" ON "transaction"("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transaction_account" ON "transaction"("account_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_account"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_household"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_budget_plan_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_budget_plan_household"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_account_household"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_household"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_family_member_household"`);

    // Drop tables (order matters due to foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS "transaction"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_plan"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "account"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "family_member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "household"`);
  }
}
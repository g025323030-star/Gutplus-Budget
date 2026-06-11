import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the budget_plan table (and its indexes).
 * BudgetPlan has been removed from the product — the forecast engine replaces it.
 *
 * down() recreates the table and indexes so the migration can be reverted if needed.
 */
export class DropBudgetPlanTable1781000000000 implements MigrationInterface {
  name = 'DropBudgetPlanTable1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first (they reference the table)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_budget_plan_household"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_budget_plan_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_budget_plan_with_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_budget_plan_without_category"`);

    // Drop the table
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_plan"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budget_plan" (
        "id"           UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "amount"       DECIMAL(18, 2)    NOT NULL,
        "month"        INTEGER           NOT NULL,
        "year"         INTEGER           NOT NULL,
        "household_id" UUID              NOT NULL,
        "category_id"  UUID,
        "created_at"   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
        "updated_at"   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_budget_plan" PRIMARY KEY ("id"),
        CONSTRAINT "FK_budget_plan_household"
          FOREIGN KEY ("household_id") REFERENCES "household"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_budget_plan_category"
          FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL
      )
    `);

    // Recreate indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_budget_plan_household" ON "budget_plan" ("household_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_budget_plan_category" ON "budget_plan" ("category_id")`,
    );

    // Partial unique indexes (PostgreSQL treats NULLs as distinct in regular UNIQUE)
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
  }
}

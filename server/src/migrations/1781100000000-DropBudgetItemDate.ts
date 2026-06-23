import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropBudgetItemDate1781100000000 implements MigrationInterface {
  name = 'DropBudgetItemDate1781100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The app moved from historical transaction logging to forward monthly
    // forecasting: a budget item is a recurring/averaged monthly amount, not a
    // dated transaction. Month anchoring now relies on assigned_month, so the
    // per-row date column and its index are no longer needed.
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_budget_item_date"`);
    await queryRunner.query(
      `ALTER TABLE "budget_item" DROP COLUMN IF EXISTS "date"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the column as nullable so existing rows do not violate NOT NULL,
    // then restore the index.
    await queryRunner.query(
      `ALTER TABLE "budget_item" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP WITH TIME ZONE NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_budget_item_date" ON "budget_item" ("date")`,
    );
  }
}

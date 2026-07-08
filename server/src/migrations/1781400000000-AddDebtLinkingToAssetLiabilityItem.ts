import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDebtLinkingToAssetLiabilityItem1781400000000 implements MigrationInterface {
  name = 'AddDebtLinkingToAssetLiabilityItem1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Nullable reference to the source BudgetItem (not a FK to avoid cascade issues)
    await queryRunner.query(`
      ALTER TABLE "asset_liability_item"
        ADD COLUMN IF NOT EXISTS "source_budget_item_id" VARCHAR(36) NULL
    `);

    // Snapshot of the monthly-equivalent payment at the time of linking
    await queryRunner.query(`
      ALTER TABLE "asset_liability_item"
        ADD COLUMN IF NOT EXISTS "monthly_payment" DECIMAL(18,2) NULL
    `);

    // Last month the principal was auto-decreased, stored as 'YYYY-MM'
    await queryRunner.query(`
      ALTER TABLE "asset_liability_item"
        ADD COLUMN IF NOT EXISTS "last_decrease_year_month" VARCHAR(7) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ali_source_budget_item"
        ON "asset_liability_item" ("source_budget_item_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ali_source_budget_item"`);
    await queryRunner.query(`ALTER TABLE "asset_liability_item" DROP COLUMN IF EXISTS "last_decrease_year_month"`);
    await queryRunner.query(`ALTER TABLE "asset_liability_item" DROP COLUMN IF EXISTS "monthly_payment"`);
    await queryRunner.query(`ALTER TABLE "asset_liability_item" DROP COLUMN IF EXISTS "source_budget_item_id"`);
  }
}

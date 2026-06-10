import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Households that already have at least one income transaction predate the
 * income-templates feature and are returning users, not first-time users.
 * Backfill their flag to true so they get the "add templates" button instead
 * of the first-use auto-fill behavior. A transaction is "income" when its
 * linked category is of type INCOME. Brand-new households keep the default
 * false.
 */
export class BackfillIncomeTemplatesInitialized1780700100000
  implements MigrationInterface
{
  name = 'BackfillIncomeTemplatesInitialized1780700100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "household"
      SET "income_templates_initialized" = true
      WHERE EXISTS (
        SELECT 1
        FROM "transaction" t
        JOIN "category" c ON c."id" = t."category_id"
        WHERE t."household_id" = "household"."id"
          AND c."type" = 'INCOME'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "household"
      SET "income_templates_initialized" = false
      WHERE EXISTS (
        SELECT 1
        FROM "transaction" t
        JOIN "category" c ON c."id" = t."category_id"
        WHERE t."household_id" = "household"."id"
          AND c."type" = 'INCOME'
      )
    `);
  }
}

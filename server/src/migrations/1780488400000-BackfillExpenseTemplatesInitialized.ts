import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Households that already have transactions predate the expense-templates
 * feature and are returning users, not first-time users. Backfill their flag to
 * true so they get the "add templates" button instead of the first-use
 * auto-fill behavior. Brand-new households keep the default false.
 */
export class BackfillExpenseTemplatesInitialized1780488400000
  implements MigrationInterface
{
  name = 'BackfillExpenseTemplatesInitialized1780488400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "household"
      SET "expense_templates_initialized" = true
      WHERE EXISTS (
        SELECT 1 FROM "transaction" t WHERE t."household_id" = "household"."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "household"
      SET "expense_templates_initialized" = false
      WHERE EXISTS (
        SELECT 1 FROM "transaction" t WHERE t."household_id" = "household"."id"
      )
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpenseTemplatesInitializedToHousehold1780488397974 implements MigrationInterface {
  name = 'AddExpenseTemplatesInitializedToHousehold1780488397974';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "household"
      ADD COLUMN "expense_templates_initialized" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "household" DROP COLUMN "expense_templates_initialized"`);
  }
}

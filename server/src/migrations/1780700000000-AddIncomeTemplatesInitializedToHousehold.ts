import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncomeTemplatesInitializedToHousehold1780700000000 implements MigrationInterface {
  name = 'AddIncomeTemplatesInitializedToHousehold1780700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "household"
      ADD COLUMN "income_templates_initialized" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "household" DROP COLUMN "income_templates_initialized"`);
  }
}

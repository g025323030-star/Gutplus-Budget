import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnboardingCompletedToUser1748000000000 implements MigrationInterface {
  name = 'AddOnboardingCompletedToUser1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "onboarding_completed" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      UPDATE "user"
      SET "onboarding_completed" = true
      WHERE "id" IN (SELECT DISTINCT "user_id" FROM "household" WHERE "user_id" IS NOT NULL)
    `);

    await queryRunner.query(`
      ALTER TABLE "household"
      ALTER COLUMN "family_size" SET DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "household" SET "family_size" = 0 WHERE "family_size" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "household" ALTER COLUMN "family_size" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "onboarding_completed"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveFrequencyToTransaction1748500000000
  implements MigrationInterface
{
  name = 'MoveFrequencyToTransaction1748500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "transaction_frequency_enum" AS ENUM ('MONTHLY', 'YEARLY')`,
    );

    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN "frequency" "transaction_frequency_enum"`,
    );

    await queryRunner.query(`
      UPDATE "transaction" AS t
      SET "frequency" = c."frequency"::text::"transaction_frequency_enum"
      FROM "category" AS c
      WHERE t."category_id" = c."id"
    `);

    await queryRunner.query(
      `UPDATE "transaction" SET "frequency" = 'MONTHLY' WHERE "frequency" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "frequency" SET NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "frequency"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "category_frequency_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "category_frequency_enum" AS ENUM ('MONTHLY', 'YEARLY')`,
    );

    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN "frequency" "category_frequency_enum"`,
    );

    await queryRunner.query(`
      UPDATE "category" AS c
      SET "frequency" = (
        SELECT t."frequency"::text::"category_frequency_enum"
        FROM "transaction" AS t
        WHERE t."category_id" = c."id"
        LIMIT 1
      )
    `);

    await queryRunner.query(
      `UPDATE "category" SET "frequency" = 'MONTHLY' WHERE "frequency" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "frequency" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "frequency"`,
    );

    await queryRunner.query(
      `DROP TYPE IF EXISTS "transaction_frequency_enum"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInstallmentsToTransaction1748600000000
  implements MigrationInterface
{
  name = 'AddInstallmentsToTransaction1748600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN "installments_total" int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN "installment_index" int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN "installment_group_id" uuid NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transaction_installment_group" ON "transaction" ("installment_group_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transaction_installment_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "installment_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "installment_index"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "installments_total"`,
    );
  }
}

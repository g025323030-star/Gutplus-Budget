import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeRecurringAccountNullable1780600000000
  implements MigrationInterface
{
  name = 'MakeRecurringAccountNullable1780600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Recurring expenses are created from the Expenses page, which has no
    // financial-account picker. The account is therefore optional.
    await queryRunner.query(
      `ALTER TABLE "recurring_transactions" ALTER COLUMN "account_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recurring_transactions" ALTER COLUMN "account_id" SET NOT NULL`,
    );
  }
}

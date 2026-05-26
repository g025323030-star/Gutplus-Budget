import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecurringTransactions1748700000000
  implements MigrationInterface
{
  name = 'AddRecurringTransactions1748700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "installments_total" int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "installment_index" int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "installment_group_id" uuid NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transaction_installment_group" ON "transaction" ("installment_group_id")`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'recurring_transaction_frequency_enum'
        ) THEN
          CREATE TYPE "recurring_transaction_frequency_enum"
          AS ENUM ('MONTHLY', 'BI_MONTHLY');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE "recurring_transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "amount" decimal(18,2) NOT NULL,
        "description" text NOT NULL,
        "day_of_month" int NOT NULL,
        "frequency" "recurring_transaction_frequency_enum" NOT NULL,
        "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "household_id" uuid NOT NULL
          REFERENCES "household"("id") ON DELETE CASCADE,
        "category_id" uuid NOT NULL
          REFERENCES "category"("id") ON DELETE CASCADE,
        "account_id" uuid NOT NULL
          REFERENCES "account"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recurring_transaction_household"
      ON "recurring_transactions" ("household_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_recurring_transaction_household"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "recurring_transactions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "recurring_transaction_frequency_enum"`,
    );
  }
}

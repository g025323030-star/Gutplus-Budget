import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameToBudgetItem1780800000000 implements MigrationInterface {
  name = 'RenameToBudgetItem1780800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename the transaction table to budget_item
    await queryRunner.query(`ALTER TABLE "transaction" RENAME TO "budget_item"`);

    // Rename indexes
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_transaction_date" RENAME TO "IDX_budget_item_date"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_transaction_installment_group" RENAME TO "IDX_budget_item_installment_group"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_transaction_household" RENAME TO "IDX_budget_item_household"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_transaction_category" RENAME TO "IDX_budget_item_category"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_transaction_account" RENAME TO "IDX_budget_item_account"`,
    );

    // Add end_date column
    await queryRunner.query(
      `ALTER TABLE "budget_item" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP WITH TIME ZONE NULL`,
    );

    // Drop recurring_transactions table (and its index)
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_recurring_transaction_household"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "recurring_transactions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "recurring_transaction_frequency_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore recurring_transactions table
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
      CREATE TABLE IF NOT EXISTS "recurring_transactions" (
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
      CREATE INDEX IF NOT EXISTS "IDX_recurring_transaction_household"
      ON "recurring_transactions" ("household_id")
    `);

    // Remove end_date column
    await queryRunner.query(
      `ALTER TABLE "budget_item" DROP COLUMN IF EXISTS "end_date"`,
    );

    // Rename indexes back
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_budget_item_date" RENAME TO "IDX_transaction_date"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_budget_item_installment_group" RENAME TO "IDX_transaction_installment_group"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_budget_item_household" RENAME TO "IDX_transaction_household"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_budget_item_category" RENAME TO "IDX_transaction_category"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_budget_item_account" RENAME TO "IDX_transaction_account"`,
    );

    // Rename table back
    await queryRunner.query(`ALTER TABLE "budget_item" RENAME TO "transaction"`);
  }
}

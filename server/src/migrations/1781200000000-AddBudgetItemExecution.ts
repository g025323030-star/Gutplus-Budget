import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBudgetItemExecution1781200000000 implements MigrationInterface {
  name = 'AddBudgetItemExecution1781200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budget_item_execution" (
        "id"                UUID          NOT NULL DEFAULT gen_random_uuid(),
        "budget_item_id"    UUID          NOT NULL,
        "household_id"      UUID          NOT NULL,
        "month"             INT           NOT NULL,
        "year"              INT           NOT NULL,
        "forecast_override" DECIMAL(18,2) NULL,
        "actual"            DECIMAL(18,2) NULL,
        "created_at"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budget_item_execution" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_budget_item_execution_month" CHECK ("month" >= 1 AND "month" <= 12),
        CONSTRAINT "FK_budget_item_execution_budget_item"
          FOREIGN KEY ("budget_item_id") REFERENCES "budget_item" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_budget_item_execution_household"
          FOREIGN KEY ("household_id") REFERENCES "household" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_budget_item_execution_item_month_year"
          UNIQUE ("budget_item_id", "month", "year")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_budget_item_execution_household_year"
        ON "budget_item_execution" ("household_id", "year")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_budget_item_execution_household_year"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_item_execution"`);
  }
}

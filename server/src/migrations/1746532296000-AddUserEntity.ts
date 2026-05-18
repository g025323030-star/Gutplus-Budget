import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEntity1746532296000 implements MigrationInterface {
  name = 'AddUserEntity1746532296000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user table
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "last_name" varchar(255) NOT NULL,
        "cycle" varchar(255),
        "expiration_date" TIMESTAMP WITH TIME ZONE,
        "subscription_type" varchar(255),
        "email" varchar(255) NOT NULL UNIQUE,
        "password" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Add user_id column to household table
    await queryRunner.query(`
      ALTER TABLE "household"
      ADD COLUMN "user_id" uuid
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "household"
      ADD CONSTRAINT "FK_household_user"
      FOREIGN KEY ("user_id")
      REFERENCES "user"("id")
      ON DELETE SET NULL
    `);

    // Create index on household user_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_household_user"
      ON "household" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_household_user"`);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "household"
      DROP CONSTRAINT IF EXISTS "FK_household_user"
    `);

    // Drop user_id column
    await queryRunner.query(`
      ALTER TABLE "household"
      DROP COLUMN IF EXISTS "user_id"
    `);

    // Drop user table
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokenEntity1747000000000 implements MigrationInterface {
  name = 'AddPasswordResetTokenEntity1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_token" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "token" varchar(255) NOT NULL UNIQUE,
        "user_id" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "password_reset_token"
      ADD CONSTRAINT "FK_password_reset_token_user"
      FOREIGN KEY ("user_id")
      REFERENCES "user"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_token_user"
      ON "password_reset_token" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_password_reset_token_user"`);
    await queryRunner.query(`
      ALTER TABLE "password_reset_token"
      DROP CONSTRAINT IF EXISTS "FK_password_reset_token_user"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_token"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetLiabilityItem1781300000000 implements MigrationInterface {
  name = 'CreateAssetLiabilityItem1781300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "asset_side_enum" AS ENUM ('ASSET', 'LIABILITY')
    `);

    await queryRunner.query(`
      CREATE TYPE "asset_liability_category_enum" AS ENUM ('REAL_ESTATE', 'PENSION', 'SAVINGS', 'LOAN', 'DEBT')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset_liability_item" (
        "id"               UUID                          NOT NULL DEFAULT gen_random_uuid(),
        "name"             VARCHAR(255)                  NOT NULL,
        "side"             asset_side_enum               NOT NULL,
        "category"         asset_liability_category_enum NOT NULL,
        "value"            DECIMAL(18,2)                 NOT NULL,
        "currency"         currency_code_enum            NOT NULL DEFAULT 'ILS',
        "interest_rate"    DECIMAL(5,2)                  NULL,
        "target_amount"    DECIMAL(18,2)                 NULL,
        "urgency_level"    INT                           NULL,
        "family_member_id" UUID                          NULL,
        "household_id"     UUID                          NOT NULL,
        "created_at"       TIMESTAMP WITH TIME ZONE      NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP WITH TIME ZONE      NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asset_liability_item" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_ali_urgency" CHECK ("urgency_level" IS NULL OR ("urgency_level" >= 1 AND "urgency_level" <= 3)),
        CONSTRAINT "FK_ali_family_member"
          FOREIGN KEY ("family_member_id") REFERENCES "family_member"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ali_household"
          FOREIGN KEY ("household_id") REFERENCES "household"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ali_household"
        ON "asset_liability_item" ("household_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ali_family_member"
        ON "asset_liability_item" ("family_member_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ali_family_member"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ali_household"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_liability_item"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "asset_liability_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "asset_side_enum"`);
  }
}

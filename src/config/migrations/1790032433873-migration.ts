import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1790032433873 implements MigrationInterface {
  name = "Migration1790032433873";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "game_meta"
        `);

    await queryRunner.query(`
            CREATE TABLE "price_history" (
                "id" SERIAL NOT NULL,
                "price" numeric(10,2),
                "oldPrice" numeric(10,2),
                "currency" character varying,
                "discount" character varying NOT NULL,
                "releaseDate" character varying,
                "releaseTime" character varying,
                "comingSoon" boolean NOT NULL,
                "isEarlyAccess" boolean NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "meta_id" integer,
                CONSTRAINT "PK_e41e25472373d4b574b153229e9"
                    PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD "currency" character varying
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP COLUMN "price"
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD "price" numeric(10,2)
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP COLUMN "oldPrice"
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD "oldPrice" numeric(10,2)
        `);

    await queryRunner.query(`
            ALTER TABLE "price_history"
            ADD CONSTRAINT "FK_bf40a1bfcd67784923a6f391e81"
            FOREIGN KEY ("meta_id")
            REFERENCES "game_meta"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "price_history"
            DROP CONSTRAINT "FK_bf40a1bfcd67784923a6f391e81"
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP COLUMN "oldPrice"
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD "oldPrice" character varying
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP COLUMN "price"
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD "price" character varying
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP COLUMN "currency"
        `);

    await queryRunner.query(`
            DROP TABLE "price_history"
        `);
  }
}

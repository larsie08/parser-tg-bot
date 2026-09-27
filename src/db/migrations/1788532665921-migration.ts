import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788532665921 implements MigrationInterface {
  name = "Migration1788532665921";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "additions" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "steamId" character varying NOT NULL,
                "href" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "game_id" integer,
                CONSTRAINT "PK_0db9a59220d75aa9870aa7e0c01"
                    PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TYPE "public"."game_meta_type"
            AS ENUM('game', 'addition')
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD "type" "public"."game_meta_type"
        `);

    await queryRunner.query(`
            UPDATE "game_meta"
            SET "type" = 'game'
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ALTER COLUMN "type" SET NOT NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD "addition_id" integer
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD CONSTRAINT "UQ_40d145ae8487e5f3d129eb02fde"
            UNIQUE ("addition_id")
        `);

    await queryRunner.query(`
            ALTER TABLE "additions"
            ADD CONSTRAINT "FK_29ea0961162e40a4b33a179175e"
            FOREIGN KEY ("game_id")
            REFERENCES "game"("game_id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            ADD CONSTRAINT "FK_40d145ae8487e5f3d129eb02fde"
            FOREIGN KEY ("addition_id")
            REFERENCES "additions"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP CONSTRAINT "FK_40d145ae8487e5f3d129eb02fde"
        `);

    await queryRunner.query(`
            ALTER TABLE "additions"
            DROP CONSTRAINT "FK_29ea0961162e40a4b33a179175e"
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP CONSTRAINT "UQ_40d145ae8487e5f3d129eb02fde"
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP COLUMN "addition_id"
        `);

    await queryRunner.query(`
            ALTER TABLE "game_meta"
            DROP COLUMN "type"
        `);

    await queryRunner.query(`
            DROP TYPE "public"."game_meta_type"
        `);

    await queryRunner.query(`
            DROP TABLE "additions"
        `);
  }
}

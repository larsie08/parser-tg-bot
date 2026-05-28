import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779969442380 implements MigrationInterface {
  name = "Migration1779969442380";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE "game"
    ADD "href" character varying
  `);

    await queryRunner.query(`
    UPDATE "game"
    SET "href" = gm."href"
    FROM "game_meta" gm
    WHERE gm."game_id" = game."game_id"
  `);

    await queryRunner.query(`
    ALTER TABLE "game_meta"
    DROP COLUMN "href"
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_meta"
      ADD "href" character varying
    `);

    await queryRunner.query(`
      UPDATE "game_meta"
      SET "href" = g."href"
      FROM "game" g
      WHERE g."game_id" = game_meta."game_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "game"
      DROP COLUMN "href"
    `);
  }
}

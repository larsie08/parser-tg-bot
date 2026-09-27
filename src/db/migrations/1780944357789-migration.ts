import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780944357789 implements MigrationInterface {
  name = "Migration1780944357789";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_news_subscription" (
        "id" SERIAL NOT NULL,
        "patches" boolean NOT NULL DEFAULT true,
        "discounts" boolean NOT NULL DEFAULT true,
        "announcements" boolean NOT NULL DEFAULT true,
        "devDiary" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" integer,
        CONSTRAINT "UQ_f9a6b3de209948d45eed1d6afc7" UNIQUE ("user_id"),
        CONSTRAINT "REL_f9a6b3de209948d45eed1d6afc" UNIQUE ("user_id"),
        CONSTRAINT "PK_679bef9b4c7cc822bc0bb0c7b96" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "game"
      ALTER COLUMN "href" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_news_subscription"
      ADD CONSTRAINT "FK_f9a6b3de209948d45eed1d6afc7"
      FOREIGN KEY ("user_id")
      REFERENCES "user"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      INSERT INTO "user_news_subscription" (
        "user_id",
        "patches",
        "discounts",
        "announcements",
        "devDiary"
      )
      SELECT
        u.id,
        true,
        true,
        true,
        true
      FROM "user" u
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_news_subscription" DROP CONSTRAINT "FK_f9a6b3de209948d45eed1d6afc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game" ALTER COLUMN "href" DROP NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "user_news_subscription"`);
  }
}

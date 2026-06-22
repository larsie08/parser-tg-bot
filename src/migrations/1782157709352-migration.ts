import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782157709352 implements MigrationInterface {
    name = 'Migration1782157709352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "game_news_subscription" ("id" SERIAL NOT NULL, "patches" boolean NOT NULL DEFAULT true, "discounts" boolean NOT NULL DEFAULT true, "announcements" boolean NOT NULL DEFAULT true, "devDiary" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, "game_id" integer, CONSTRAINT "UQ_7577c204d59dcc2a466c5b3dd6c" UNIQUE ("user_id", "game_id"), CONSTRAINT "PK_4cc6aabcbc90d58abcde12e54cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "game_news_subscription" ADD CONSTRAINT "FK_a89bd48c8b7d5c983dc288d2efc" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_news_subscription" ADD CONSTRAINT "FK_94845413ef6e5b0fd6181c40ad3" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_news_subscription" DROP CONSTRAINT "FK_94845413ef6e5b0fd6181c40ad3"`);
        await queryRunner.query(`ALTER TABLE "game_news_subscription" DROP CONSTRAINT "FK_a89bd48c8b7d5c983dc288d2efc"`);
        await queryRunner.query(`DROP TABLE "game_news_subscription"`);
    }

}

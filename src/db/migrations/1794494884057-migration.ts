import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1794494884057 implements MigrationInterface {
    name = 'Migration1794494884057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_games" DROP CONSTRAINT "FK_52610929b0f86d508a20769bd9a"`);
        await queryRunner.query(`ALTER TABLE "user_news_subscription" ADD "giveaway" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "game_meta" DROP COLUMN "releaseTime"`);
        await queryRunner.query(`ALTER TABLE "game_meta" ADD "releaseTime" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "price_history" DROP COLUMN "releaseTime"`);
        await queryRunner.query(`ALTER TABLE "price_history" ADD "releaseTime" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user_games" ADD CONSTRAINT "FK_52610929b0f86d508a20769bd9a" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_games" DROP CONSTRAINT "FK_52610929b0f86d508a20769bd9a"`);
        await queryRunner.query(`ALTER TABLE "price_history" DROP COLUMN "releaseTime"`);
        await queryRunner.query(`ALTER TABLE "price_history" ADD "releaseTime" character varying`);
        await queryRunner.query(`ALTER TABLE "game_meta" DROP COLUMN "releaseTime"`);
        await queryRunner.query(`ALTER TABLE "game_meta" ADD "releaseTime" character varying`);
        await queryRunner.query(`ALTER TABLE "user_news_subscription" DROP COLUMN "giveaway"`);
        await queryRunner.query(`ALTER TABLE "user_games" ADD CONSTRAINT "FK_52610929b0f86d508a20769bd9a" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

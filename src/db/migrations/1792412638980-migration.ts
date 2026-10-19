import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1792412638980 implements MigrationInterface {
    name = 'Migration1792412638980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_meta" DROP COLUMN "releaseTime"`);
        await queryRunner.query(`ALTER TABLE "game_meta" ADD "releaseTime" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "price_history" DROP COLUMN "releaseTime"`);
        await queryRunner.query(`ALTER TABLE "price_history" ADD "releaseTime" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "price_history" DROP COLUMN "releaseTime"`);
        await queryRunner.query(`ALTER TABLE "price_history" ADD "releaseTime" character varying`);
        await queryRunner.query(`ALTER TABLE "game_meta" DROP COLUMN "releaseTime"`);
        await queryRunner.query(`ALTER TABLE "game_meta" ADD "releaseTime" character varying`);
    }

}

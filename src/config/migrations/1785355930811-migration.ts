import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785355930811 implements MigrationInterface {
    name = 'Migration1785355930811'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_meta" ADD "isEarlyAccess" boolean`);
        await queryRunner.query(`ALTER TABLE "game_meta" ADD "lastSteamPageCheck" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_meta" DROP COLUMN "lastSteamPageCheck"`);
        await queryRunner.query(`ALTER TABLE "game_meta" DROP COLUMN "isEarlyAccess"`);
    }

}

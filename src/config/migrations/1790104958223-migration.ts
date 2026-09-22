import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1790104958223 implements MigrationInterface {
    name = 'Migration1790104958223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_meta" DROP COLUMN "lastSteamPageCheck"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_meta" ADD "lastSteamPageCheck" TIMESTAMP`);
    }

}

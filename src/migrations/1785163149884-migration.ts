import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785163149884 implements MigrationInterface {
    name = 'Migration1785163149884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_meta" ADD "comingSoon" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_meta" DROP COLUMN "comingSoon"`);
    }

}

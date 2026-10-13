import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791905220880 implements MigrationInterface {
    name = 'Migration1791905220880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news" ADD "publishedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news" DROP COLUMN "publishedAt"`);
    }

}

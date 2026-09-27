import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1790095314880 implements MigrationInterface {
    name = 'Migration1790095314880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "price_history" ALTER COLUMN "discount" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "price_history" ALTER COLUMN "discount" SET NOT NULL`);
    }

}

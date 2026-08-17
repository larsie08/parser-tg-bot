import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779730866665 implements MigrationInterface {
    name = 'Migration1779730866665'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "userName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "news" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "newsId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "game_id" integer, CONSTRAINT "PK_39a43dfcb6007180f04aff2357e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game_meta" ("id" SERIAL NOT NULL, "price" character varying, "oldPrice" character varying, "discount" character varying, "releaseDate" character varying, "releaseTime" character varying, "href" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "game_id" integer, CONSTRAINT "REL_d2b7bfc9cf53a9abfb7efd6423" UNIQUE ("game_id"), CONSTRAINT "PK_dee1844046df6e1905106de14b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game" ("game_id" SERIAL NOT NULL, "name" character varying NOT NULL, "steamId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b09eea8ea244730f3f339e3152" PRIMARY KEY ("game_id"))`);
        await queryRunner.query(`CREATE TABLE "user_games" ("user_id" integer NOT NULL, "game_id" integer NOT NULL, CONSTRAINT "PK_a0c46573b2eeb903a867999c159" PRIMARY KEY ("user_id", "game_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9432b81f913c6e29e539103898" ON "user_games" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_52610929b0f86d508a20769bd9" ON "user_games" ("game_id") `);
        await queryRunner.query(`ALTER TABLE "news" ADD CONSTRAINT "FK_bc1272dace516c7a5e4b12459ff" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_meta" ADD CONSTRAINT "FK_d2b7bfc9cf53a9abfb7efd64231" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_games" ADD CONSTRAINT "FK_9432b81f913c6e29e5391038981" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_games" ADD CONSTRAINT "FK_52610929b0f86d508a20769bd9a" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_games" DROP CONSTRAINT "FK_52610929b0f86d508a20769bd9a"`);
        await queryRunner.query(`ALTER TABLE "user_games" DROP CONSTRAINT "FK_9432b81f913c6e29e5391038981"`);
        await queryRunner.query(`ALTER TABLE "game_meta" DROP CONSTRAINT "FK_d2b7bfc9cf53a9abfb7efd64231"`);
        await queryRunner.query(`ALTER TABLE "news" DROP CONSTRAINT "FK_bc1272dace516c7a5e4b12459ff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52610929b0f86d508a20769bd9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9432b81f913c6e29e539103898"`);
        await queryRunner.query(`DROP TABLE "user_games"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TABLE "game_meta"`);
        await queryRunner.query(`DROP TABLE "news"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}

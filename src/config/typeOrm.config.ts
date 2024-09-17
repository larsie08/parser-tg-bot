import { DataSource } from "typeorm";

import { ConfigService } from "./config.service";

import { Game, User } from "../entities";

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: configService.get("DB_HOST"),
  port: Number(configService.get("DB_PORT")),
  username: configService.get("DB_USERNAME"),
  password: configService.get("DB_PASSWORD"),
  database: configService.get("DB_NAME"),
  entities: [Game, User],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
  logging: true,
});

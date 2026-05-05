import { In } from "typeorm";

import { Game, News } from "../entities";
import { AppDataSource } from "../config/typeOrm.config";

export class NewsService {
  async getNewsGame(gameId: string): Promise<News[]> {
    return await AppDataSource.getRepository(News).findBy({
      game: { steamId: gameId },
    });
  }

  async saveNewsGame(name: string, newsId: string, game: Game): Promise<void> {
    const newsObj = AppDataSource.getRepository(News).create({
      name,
      newsId,
      game,
    });

    await AppDataSource.getRepository(News).save(newsObj);
  }
}

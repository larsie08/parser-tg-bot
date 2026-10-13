import { Repository } from "typeorm";
import { Game, News } from "../..";

export class NewsService {
  constructor(private readonly newsRepository: Repository<News>) {}

  async getNewsGame(gameId: string): Promise<News[]> {
    return await this.newsRepository.findBy({
      game: { steamId: gameId },
    });
  }

  async saveNewsGame(
    name: string,
    newsId: string,
    game: Game,
    publishedAt: number,
  ): Promise<void> {
    const newsObj = this.newsRepository.create({
      name,
      newsId,
      game,
      publishedAt: new Date(publishedAt * 1000),
    });

    await this.newsRepository.save(newsObj);
  }
}

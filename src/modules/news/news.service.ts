import { Repository } from "typeorm";
import { Game, News } from "..";

export class NewsService {
  constructor(private readonly newsRepository: Repository<News>) {}

  async getNewsGame(gameId: string): Promise<News[]> {
    return await this.newsRepository.findBy({
      game: { steamId: gameId },
    });
  }

  async saveNewsGame(name: string, newsId: string, game: Game): Promise<void> {
    const newsObj = this.newsRepository.create({
      name,
      newsId,
      game,
    });

    await this.newsRepository.save(newsObj);
  }
}

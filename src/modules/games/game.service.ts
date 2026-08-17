import { Repository } from "typeorm";
import { Game } from "./game.entity";

export class GameService {
  constructor(private readonly gameRepository: Repository<Game>) {}

  async getUserGame(gameId: number): Promise<Game | null> {
    return await this.gameRepository.findOne({
      where: { id: gameId },
      relations: { meta: true },
    });
  }

  async getUserGameWithSubscriptions(gameId: number): Promise<Game | null> {
    return await this.gameRepository.findOne({
      where: { id: gameId },
      relations: {
        subscriptions: { user: true },
      },
    });
  }

  async getGamesOfUsersWithSubscriptions(): Promise<Game[] | null> {
    return await this.gameRepository.find({
      relations: {
        meta: true,
        users: {
          UserNewsSubscription: true,
          gameSubscriptions: { game: true },
        },
      },
    });
  }

  async getUserAllGames(userId: number): Promise<Game[]> {
    return this.gameRepository.find({
      where: { users: { userId } },
    });
  }

  async deleteGame(game: Game): Promise<void> {
    const gameWithUsers = await this.gameRepository.findOne({
      where: { id: game.id },
      relations: { users: true },
    });

    if (gameWithUsers?.users.length === 0)
      await this.gameRepository.remove(game);
  }

  async saveGame(name: string, steamId: string, href: string): Promise<Game> {
    const isExistingGame = await this.gameRepository.findOneBy({
      steamId,
    });

    if (isExistingGame) return isExistingGame;

    const game = this.gameRepository.create({ name, steamId, href });

    return await this.gameRepository.save(game);
  }
}

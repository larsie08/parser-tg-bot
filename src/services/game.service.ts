import { AppDataSource } from "../config/typeOrm.config";
import { Game } from "../entities";

export class GameService {
  async getUserGame(gameId: number): Promise<Game | null> {
    return await AppDataSource.getRepository(Game).findOne({
      where: { id: gameId },
      relations: { meta: true },
    });
  }

  async getUserGameWithSubscriptions(gameId: number): Promise<Game | null> {
    return await AppDataSource.getRepository(Game).findOne({
      where: { id: gameId },
      relations: {
        subscriptions: { user: true },
      },
    });
  }

  async getGamesOfUsersWithSubscriptions(): Promise<Game[] | null> {
    return await AppDataSource.getRepository(Game).find({
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
    return AppDataSource.getRepository(Game).find({
      where: { users: { userId } },
    });
  }

  async deleteGame(game: Game): Promise<void> {
    const repo = AppDataSource.getRepository(Game);

    const gameWithUsers = await repo.findOne({
      where: { id: game.id },
      relations: { users: true },
    });

    if (gameWithUsers?.users.length === 0) await repo.remove(game);
  }

  async saveGame(name: string, steamId: string, href: string): Promise<Game> {
    const repo = AppDataSource.getRepository(Game);

    const isExistingGame = await repo.findOneBy({
      steamId,
    });

    if (isExistingGame) return isExistingGame;

    const game = repo.create({ name, steamId, href });

    return await repo.save(game);
  }
}

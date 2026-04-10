import { AppDataSource } from "../config";
import { Game } from "../entities";

export class GameService {
  async getUserGame(gameName: string): Promise<Game | null> {
    return await AppDataSource.getRepository(Game).findOne({
      where: { name: gameName },
      relations: { meta: true },
    });
  }

  async getGamesOfUsers(): Promise<Game[] | null> {
    return await AppDataSource.getRepository(Game).find({
      relations: { meta: true, users: true },
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

  async saveGame(name: string, steamId: string): Promise<Game> {
    const repo = AppDataSource.getRepository(Game);

    const isExistingGame = await repo.findOneBy({
      steamId,
    });

    if (isExistingGame) return isExistingGame;

    const game = repo.create({ name, steamId });

    return await repo.save(game);
  }
}

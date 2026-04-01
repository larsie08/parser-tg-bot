import { AppDataSource } from "../config";
import { Game } from "../entities";

export class GameService {
  async getUserGame(gameName: string): Promise<Game | null> {
    return await AppDataSource.getRepository(Game).findOneBy({
      name: gameName,
    });
  }

  async deleteGame(game: Game): Promise<void> {
    await AppDataSource.getRepository(Game).remove(game);
  }
}

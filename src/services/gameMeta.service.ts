import { AppDataSource } from "../config";
import { IGameSteamData } from "../context";
import { Game, GameMeta } from "../entities";

export class GameMetaService {
  async upsertMetaInfo(gameData: IGameSteamData, game: Game): Promise<void> {
    const repo = AppDataSource.getRepository(GameMeta);

    let meta = await repo.findOne({ where: { game: { id: game.id } } });

    if (!meta) meta = repo.create({ game });

    Object.assign(meta, {
      price: gameData.price,
      oldPrice: gameData.oldPrice ?? null,
      discount: gameData.discount ?? null,
      releaseDate: gameData.releaseDate ?? null,
      releaseTime: gameData.releaseTime ?? null,
      href: gameData.href,
    });

    await repo.save(meta);
  }

  async getMetaInfo(game: Game): Promise<GameMeta | null> {
    return await AppDataSource.getRepository(GameMeta).findOneBy({
      game_id: game.id,
    });
  }
}

import { AppDataSource } from "../config/typeOrm.config";
import { IGameSteamData } from "../context";
import { Game, GameMeta } from "../entities";

export class GameMetaService {
  async upsertMetaInfo(gameData: IGameSteamData, game: Game): Promise<void> {
    const gameMetaRepo = AppDataSource.getRepository(GameMeta);
    const gameRepo = AppDataSource.getRepository(Game);

    let meta = await gameMetaRepo.findOneBy({ game });

    if (!meta) meta = gameMetaRepo.create({ game });

    Object.assign(meta, {
      price: gameData.price,
      oldPrice:
        meta.oldPrice && gameData.price && meta.oldPrice >= gameData.price
          ? gameData.price
          : meta.oldPrice || null,
      discount: gameData.discount ?? null,
      releaseDate: gameData.releaseDate ?? null,
      releaseTime: gameData.releaseTime ?? null,
      href: gameData.href,
    });

    await gameMetaRepo.save(meta);

    if (!game.meta || game.meta.game !== meta.game) {
      game.meta = meta;
      await gameRepo.save(game);
    }
  }

  async getMetaInfo(game: Game): Promise<GameMeta | null> {
    return await AppDataSource.getRepository(GameMeta).findOneBy({
      game,
    });
  }
}

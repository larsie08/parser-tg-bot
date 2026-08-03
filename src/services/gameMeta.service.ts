import { AppDataSource } from "../config/typeOrm.config";

import { IGameSteamData } from "../context";
import { Game, GameMeta } from "../entities";

export class GameMetaService {
  async upsertMetaInfo(gameData: IGameSteamData, game: Game): Promise<void> {
    const gameMetaRepo = AppDataSource.getRepository(GameMeta);

    let meta = await gameMetaRepo.findOne({
      where: {
        game: {
          id: game.id,
        },
      },
    });

    if (!meta) {
      meta = gameMetaRepo.create({ game: { id: game.id } });
    }

    Object.assign(meta, this.buildMetaUpdate(gameData, meta));

    await gameMetaRepo.save(meta);
  }

  async getMetaInfo(gameId: number): Promise<GameMeta | null> {
    return await AppDataSource.getRepository(GameMeta).findOne({
      where: { game: { id: gameId } },
    });
  }

  async getGamesIsComingSoon(): Promise<GameMeta[] | null> {
    return AppDataSource.getRepository(GameMeta).find({
      where: {
        comingSoon: true,
      },
      relations: {
        game: { users: true },
      },
    });
  }

  async upsertReleaseInfo(meta: GameMeta, releaseDate: string): Promise<void> {
    meta.releaseDate = releaseDate;
    meta.isEarlyAccess = true;
    meta.lastSteamPageCheck = new Date();

    await AppDataSource.getRepository(GameMeta).save(meta);
  }

  private buildMetaUpdate(gameData: IGameSteamData, meta: GameMeta) {
    const normalize = <T>(v: string | undefined | null): string | null =>
      v == null || v.trim() === "" ? null : v;

    return {
      price: normalize(gameData.price),
      oldPrice: normalize(
        meta.price && meta.price !== gameData.price
          ? meta.price
          : meta.oldPrice,
      ),
      discount: normalize(gameData.discount),
      comingSoon: gameData.comingSoon,
      isEarlyAccess: gameData.isEarlyAccess,
    };
  }
}

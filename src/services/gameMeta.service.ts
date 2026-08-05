import { IsNull, Not } from "typeorm";
import { AppDataSource } from "../config/typeOrm.config";

import { IGameSteamData } from "../context";
import { Game, GameMeta } from "../entities";
import { needsReleaseTracking } from "../utils";

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

  async upsertEarlyReleaseInfo(
    meta: GameMeta,
    releaseDate: string,
  ): Promise<void> {
    meta.releaseDate = releaseDate;
    meta.isEarlyAccess = true;
    meta.lastSteamPageCheck = new Date();

    await AppDataSource.getRepository(GameMeta).save(meta);
  }

  async upsertReleaseDate(meta: GameMeta, releaseDate: string): Promise<void> {
    meta.releaseDate = releaseDate;

    await AppDataSource.getRepository(GameMeta).save(meta);
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

  async getGamesWithUpcomingRelease(userId: number): Promise<GameMeta[]> {
    return AppDataSource.getRepository(GameMeta).find({
      where: [
        {
          game: { users: { id: userId } },
          comingSoon: true,
        },
        {
          game: { users: { id: userId } },
          isEarlyAccess: true,
        },
      ],
      relations: {
        game: true,
      },
    });
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
      releaseDate: gameData.releaseDate,
      isEarlyAccess: gameData.isEarlyAccess,
    };
  }
}

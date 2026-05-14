import { AppDataSource } from "../config/typeOrm.config";
import { IGameSteamData } from "../context";
import { Game, GameMeta } from "../entities";

export class GameMetaService {
  async upsertMetaInfo(gameData: IGameSteamData, game: Game): Promise<void> {
    const gameMetaRepo = AppDataSource.getRepository(GameMeta);
    const gameRepo = AppDataSource.getRepository(Game);

    let meta = await gameMetaRepo.findOne({
      where: {
        game: {
          id: game.id,
        },
      },
    });

    if (!meta) {
      meta = gameMetaRepo.create();
    }

    Object.assign(meta, this.buildMetaUpdate(gameData, meta));

    game.meta = meta;

    await gameRepo.save(game);
  }

  async getMetaInfo(game: Game): Promise<GameMeta | null> {
    return await AppDataSource.getRepository(GameMeta).findOneBy({
      game,
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
      releaseDate: normalize(gameData.releaseDate),
      releaseTime: normalize(gameData.releaseTime),
      href: gameData.href,
    };
  }
}

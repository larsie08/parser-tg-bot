import { Repository } from "typeorm";
import { Game, GameMeta } from "..";
import { IGameSteamData } from "./game.interface";

export class GameMetaService {
  constructor(private readonly gameMetaRepository: Repository<GameMeta>) {}

  async upsertMetaInfo(gameData: IGameSteamData, game: Game): Promise<void> {
    let meta = await this.gameMetaRepository.findOne({
      where: {
        game: {
          id: game.id,
        },
      },
    });

    if (!meta) {
      meta = this.gameMetaRepository.create({ game: { id: game.id } });
    }

    Object.assign(meta, this.buildMetaUpdate(gameData, meta));

    await this.gameMetaRepository.save(meta);
  }

  async upsertEarlyReleaseInfo(
    meta: GameMeta,
    releaseDate: string,
  ): Promise<void> {
    meta.releaseDate = releaseDate;
    meta.isEarlyAccess = true;
    meta.lastSteamPageCheck = new Date();

    await this.gameMetaRepository.save(meta);
  }

  async upsertReleaseDate(meta: GameMeta, releaseDate: string): Promise<void> {
    meta.releaseDate = releaseDate;

    await this.gameMetaRepository.save(meta);
  }

  async getMetaInfo(gameId: number): Promise<GameMeta | null> {
    return await this.gameMetaRepository.findOne({
      where: { game: { id: gameId } },
    });
  }

  async getGamesIsComingSoon(): Promise<GameMeta[] | null> {
    return this.gameMetaRepository.find({
      where: {
        comingSoon: true,
      },
      relations: {
        game: { users: true },
      },
    });
  }

  async getGamesWithUpcomingRelease(userId: number): Promise<GameMeta[]> {
    return this.gameMetaRepository.find({
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

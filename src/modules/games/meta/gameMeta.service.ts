import { Repository } from "typeorm";
import { buildMetaUpdate, GameMeta, GameMetaType, IGameSteamData } from "../..";

export class GameMetaService {
  constructor(private readonly gameMetaRepository: Repository<GameMeta>) {}

  async upsertMetaInfo(
    gameData: IGameSteamData,
    entityId: number,
    type: GameMetaType,
  ): Promise<void> {
    const relation = type === GameMetaType.GAME ? "game" : "addition";

    let meta = await this.gameMetaRepository.findOne({
      where: {
        [relation]: {
          id: entityId,
        },
      },
    });

    if (!meta) {
      meta = this.createMeta(entityId, type);
    }

    Object.assign(meta, buildMetaUpdate(gameData, meta));

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
      where: [
        {
          comingSoon: true,
        },
        {
          isEarlyAccess: true,
        },
      ],

      relations: {
        game: { users: true },
        addition: { game: { users: true } },
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

  private createMeta(entityId: number, type: GameMetaType): GameMeta {
    if (type === GameMetaType.GAME)
      return this.gameMetaRepository.create({
        type,
        game: { id: entityId },
      });

    return this.gameMetaRepository.create({
      type,
      addition: { id: entityId },
    });
  }
}

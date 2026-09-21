import { Repository } from "typeorm";
import {
  GameMeta,
  GameMetaService,
  GameMetaType,
  hasMetaData,
  IGameSteamData,
  PriceHistoryService,
} from "../..";

export class PriceTrackingService {
  constructor(
    private readonly metaRepository: Repository<GameMeta>,
    private readonly metaService: GameMetaService,
    private readonly historyService: PriceHistoryService,
  ) {}

  async processSaveMetaInfoAndHistory(
    gameData: IGameSteamData,
    entityId: number,
    type: GameMetaType,
  ): Promise<void> {
    const relation = type === GameMetaType.GAME ? "game" : "addition";

    let meta = await this.metaRepository.findOne({
      where: {
        [relation]: {
          id: entityId,
        },
      },
    });

    if (hasMetaData(meta) && meta)
      await this.historyService.savePriceHistory(meta.id, meta);

    await this.metaService.upsertMetaInfo(gameData, entityId, type, meta);
  }
}

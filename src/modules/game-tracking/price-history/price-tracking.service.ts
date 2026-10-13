import {
  GameMetaService,
  GameMetaType,
  getMetaRelation,
  hasMetaData,
  IGameSteamData,
  PriceHistory,
  PriceHistoryService,
} from "../..";

export class PriceTrackingService {
  constructor(
    private readonly metaService: GameMetaService,
    private readonly historyService: PriceHistoryService,
  ) {}

  async processSaveMetaInfoAndHistory(
    gameData: IGameSteamData,
    entityId: number,
    type: GameMetaType,
  ): Promise<void> {
    const relation = getMetaRelation(type);

    const meta = await this.metaService.getMetaInfo(entityId, relation);

    if (hasMetaData(meta) && meta)
      await this.historyService.savePriceHistory(meta.id, meta);

    await this.metaService.upsertMetaInfo(gameData, entityId, type, meta);
  }

  async getLowestPriceInGameHistory(
    entityId: number,
    gameData: IGameSteamData,
  ): Promise<PriceHistory | null> {
    const priceHistoryNote =
      await this.historyService.getLowestPriceInHistory(entityId);

    if (
      !priceHistoryNote ||
      gameData.price == null ||
      priceHistoryNote.price <= gameData.price ||
      priceHistoryNote.currency !== gameData.currency
    ) {
      return null;
    }

    return priceHistoryNote;
  }
}

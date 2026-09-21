import { Repository } from "typeorm";
import { GameMeta, PriceHistory } from "../..";

export class PriceHistoryService {
  constructor(private readonly historyRepository: Repository<PriceHistory>) {}

  async getLowestPriceInHistory(metaId: number): Promise<PriceHistory | null> {
    return await this.historyRepository.findOne({
      where: { meta: { id: metaId } },
      order: { price: "ASC" },
    });
  }

  async savePriceHistory(metaId: number, meta: GameMeta): Promise<void> {
    const historyObj = this.historyRepository.create({
      meta: { id: metaId },
      price: meta.price,
      oldPrice: meta.oldPrice,
      currency: meta.currency,
      discount: meta.discount,
      releaseDate: meta.releaseDate,
      releaseTime: meta.releaseTime,
      comingSoon: meta.comingSoon,
      isEarlyAccess: meta.isEarlyAccess,
    });

    await this.historyRepository.save(historyObj);
  }
}

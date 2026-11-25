import { Repository } from "typeorm";

import { Giveaway, User } from "../..";

import { GameMetaType } from "../../games/meta/gameMeta.types";
import { GiveawayEntity } from "../../../bot/jobs/jobs.types";

export class GiveawayService {
  constructor(private readonly giveawayRepository: Repository<Giveaway>) {}

  async upsertGiveawayRecord(item: GiveawayEntity): Promise<void> {
    let giveawayEntity = await this.giveawayRepository.findOne({
      where: { steamId: item.steamId },
    });

    if (!giveawayEntity) {
      giveawayEntity = this.giveawayRepository.create({
        name: item.name,
        type: item.type === "game" ? GameMetaType.GAME : GameMetaType.ADDITION,
        steamId: item.steamId,
        href: item.href,
        gameParent: "game" in item ? item.game : undefined,
        isStillBeingGiveaway: true,
      });
    }

    await this.giveawayRepository.save(giveawayEntity);
  }

  async upsertNotifiedUsers(steamId: string, users: User[]): Promise<void> {
    const giveawayEntity = await this.giveawayRepository.findOne({
      where: { steamId },
    });

    if (!giveawayEntity) throw new Error(`Giveaway ${steamId} not found`);

    for (const user of users) {
      giveawayEntity?.alreadyNotifiedUsers.push(user);
    }

    await this.giveawayRepository.save(giveawayEntity);
  }

  async findAndResponseAboutRepetableRecord(
    entitySteamId: string,
  ): Promise<Giveaway | null> {
    return await this.giveawayRepository.findOne({
      where: { steamId: entitySteamId },
    });
  }
}

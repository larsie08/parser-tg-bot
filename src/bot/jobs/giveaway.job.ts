import { Telegraf } from "telegraf";

import { Command, IBotContext, TelegramService } from "..";
import { GiveawayResolvedData, SteamService } from "../../integrations";

import {
  Game,
  GameService,
  GiveawayService,
  User,
  UserService,
} from "../../modules";

import {
  GiveawayEntity,
  GiveawayResponseData,
  IGameSteamDataWithHref,
} from "./jobs.types";

export class GiveawayJob extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameService: GameService,
    private readonly userService: UserService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
    private readonly giveawayService: GiveawayService,
  ) {
    super(bot);
  }

  async handle(): Promise<void> {
    setInterval(
      async () => {
        try {
          const entitiesOfGiveaway =
            await this.steamService.fetchGamesSteamIdGiveaway();

          if (!entitiesOfGiveaway || !entitiesOfGiveaway.length) return;

          const result =
            await this.fetchAndDefineGamesVSAdditions(entitiesOfGiveaway);

          const filteredResult =
            await this.filterRepetitiveGiveawayAndUsers(result);

          await this.handleUpsertData(filteredResult);

          await this.notifyUsersAboutGiveaway(filteredResult);
        } catch (error) {
          console.error(
            "Произошла ошибка с получением сведений о раздаче игр.",
            error,
          );
        }
      },
      24 * 60 * 60 * 1000,
    );
  }

  private async fetchAndDefineGamesVSAdditions(
    entitiesOfGiveaway: GiveawayResolvedData[],
  ): Promise<GiveawayResponseData> {
    const games: IGameSteamDataWithHref[] = [];
    const additions: (IGameSteamDataWithHref & { game: Game })[] = [];

    for (const entity of entitiesOfGiveaway) {
      const entityData = await this.steamService.fetchGameMetaInfoRegionalSteam(
        entity.steamId,
      );

      if (!entityData) continue;

      if (!entityData.fullgame) {
        games.push({ ...entityData, ...entity });
        continue;
      }

      const trackableGame = await this.gameService.getGamesWhichMatchSteamId(
        entityData.fullgame.appid,
      );

      if (trackableGame)
        additions.push({
          ...entityData,
          ...entity,
          game: trackableGame,
        });
    }

    return { games, additions };
  }

  private async filterRepetitiveGiveawayAndUsers(
    result: GiveawayResponseData,
  ): Promise<GiveawayResponseData<{ users: User[] }>> {
    const filter = async <T extends IGameSteamDataWithHref>(
      items: T[],
    ): Promise<(T & { users: User[] })[]> => {
      const filteredItems: (T & { users: User[] })[] = [];

      for (const item of items) {
        const giveawayRecord =
          await this.giveawayService.findAndResponseAboutRepetableRecord(
            item.steamId,
          );

        if (giveawayRecord) {
          const recordWhichFiltered =
            await this.userService.findAndDefineWhoDidntReceiveMessageAboutGiveaway(
              giveawayRecord,
            );

          if (!recordWhichFiltered || recordWhichFiltered instanceof Error)
            continue;

          filteredItems.push({ ...item, users: recordWhichFiltered });
        } else {
          const users =
            await this.userService.getAllUsersWhoSubscribeOnGiveaway();

          if (!users) continue;

          filteredItems.push({ ...item, users });
        }
      }

      return filteredItems;
    };

    return {
      games: await filter(result.games),
      additions: await filter(result.additions),
    };
  }

  private async handleUpsertData(
    result: GiveawayResponseData<{ users: User[] }>,
  ): Promise<void> {
    const upsert = async (items: GiveawayEntity[]): Promise<void> => {
      for (const item of items) {
        try {
          await this.giveawayService.upsertGiveawayRecord(item);
          await this.giveawayService.upsertNotifiedUsers(
            item.steamId,
            item.users,
          );
        } catch (error) {
          throw new Error(`Failed to upsert giveaway ${item.steamId}`);
        }
      }
    };

    await upsert(result.games);
    await upsert(result.additions);
  }

  private async notifyUsersAboutGiveaway(
    result: GiveawayResponseData<{ users: User[] }>,
  ): Promise<void> {
    const createAndSend = async <
      T extends IGameSteamDataWithHref<{ users: User[] }>,
    >(
      items: T[],
    ) => {
      for (const item of items) {
        const message = this.createMessageAboutGiveaway(item);

        await this.sendMessageToUsers(item.users, message);
      }
    };

    if (result.games.length) {
      await createAndSend(result.games);
    }

    if (result.additions.length) {
      await createAndSend(result.additions);
    }
  }

  private createMessageAboutGiveaway<T extends GiveawayEntity>(
    entity: T,
  ): string {
    const isDlc = entity.type === "dlc";

    const gameName = isDlc
      ? "game" in entity
        ? entity.game.name
        : entity.fullgame?.name
      : entity.name;

    return [
      "🎁 *Найдена бесплатная раздача!*",
      "",
      isDlc ? `🎮 Игра: *${gameName ?? "Неизвестно"}*` : "",
      `🕹️ ${isDlc ? "Дополнение" : "Игра"}: *${entity.name}*`,
      "",
      "🎉 *Забрать:*",
      entity.href ? `[Открыть страницу Steam](${entity.href})` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private async sendMessageToUsers(
    users: User[],
    message: string,
  ): Promise<void> {
    await Promise.all(
      users.map(async (user) => {
        try {
          await this.telegramService.sendAutoMessageToUser(
            user.userId,
            message,
          );
        } catch (error) {
          console.error(
            "Произошла ошибка с асинхронным отправлением сообщений.",
            error,
          );
        }
      }),
    );
  }
}

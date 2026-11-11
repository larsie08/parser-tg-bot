import { Telegraf } from "telegraf";

import { Command, IBotContext, TelegramService } from "..";
import { GiveawayResolvedData, SteamService } from "../../integrations";

import { Game, GameService, User, UserService } from "../../modules";

import { GiveawayEntity, IGameSteamDataWithHref } from "./jobs.types";

export class GiveawayJob extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameService: GameService,
    private readonly userService: UserService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
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
            await this.fetchAndFilterGamesVSAdditions(entitiesOfGiveaway);

          await this.notifyUsersAboutGiveaway(result);
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

  private async fetchAndFilterGamesVSAdditions(
    entitiesOfGiveaway: GiveawayResolvedData[],
  ): Promise<{
    games: IGameSteamDataWithHref[];
    additions: (IGameSteamDataWithHref & { game: Game })[];
  }> {
    const games: IGameSteamDataWithHref[] = [];
    const additions: (IGameSteamDataWithHref & { game: Game })[] = [];

    for (const entity of entitiesOfGiveaway) {
      const entityData = await this.steamService.fetchGameMetaInfoRegionalSteam(
        entity.steamId,
      );

      if (!entityData) continue;

      if (!entityData.fullgame) {
        games.push({ ...entityData, href: entity.href });
        continue;
      }

      const trackableGame = await this.gameService.getGamesWhichMatchSteamId(
        entityData.fullgame.appid,
      );

      if (trackableGame)
        additions.push({
          ...entityData,
          game: trackableGame,
          href: entity.href,
        });
    }

    return { games, additions };
  }

  private async notifyUsersAboutGiveaway(result: {
    games: IGameSteamDataWithHref[];
    additions: (IGameSteamDataWithHref & { game: Game })[];
  }): Promise<void> {
    const users = await this.userService.getAllUsers();

    if (!users)
      throw new Error(
        "Не найдено ни одного пользователя при попытке уведомления о раздаче.",
      );

    if (result.games.length) {
      for (const game of result.games) {
        const message = this.createMessageAboutGiveaway(game);

        await this.sendMessageToUsers(users, message);
      }
    }

    if (result.additions.length) {
      for (const addition of result.additions) {
        const message = this.createMessageAboutGiveaway(addition);

        await this.sendMessageToUsers(addition.game.users, message);
      }
    }
  }

  private createMessageAboutGiveaway(entity: GiveawayEntity): string {
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

import { Telegraf } from "telegraf";

import { TelegramService } from "../telegram.service";
import { ReleaseDateDataResponse, SteamService } from "../../integrations";

import {
  Additions,
  Game,
  GameMeta,
  GameMetaService,
  GameMetaType,
  hasMetaData,
  User,
} from "../../modules";

import { formatReleaseDate, getDaysUntilRelease } from "../../shared";

import { Command, IBotContext } from "..";

export class ReleaseDateJob extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly metaService: GameMetaService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
  ) {
    super(bot);
  }

  async handle(): Promise<void> {
    setInterval(
      async () => {
        const gameMeta =
          await this.metaService.getGamesWithUpcomingReleaseForJob();

        const availableGamesMeta = gameMeta?.filter((meta) =>
          /^\d{1,2}\s+[A-Za-z]{3},\s+\d{4}$/.test(
            meta.releaseDate?.trim() ?? "",
          ),
        );

        if (!availableGamesMeta)
          return console.log("Не найдено ни одной игры.");

        for (const meta of availableGamesMeta) {
          try {
            await this.processReleaseDate(meta);
          } catch (error) {
            console.error(
              `Ошибка обработки игр для пользователей. ${meta.game?.name}:`,
              error,
            );
          }
        }
      },
      240 * 60 * 1000,
    );
  }

  private async processReleaseDate(meta: GameMeta): Promise<void> {
    if (!hasMetaData(meta)) return;

    const entityOwner =
      meta.type === GameMetaType.GAME ? meta.game : meta.addition;

    if (!entityOwner) return;

    if (meta.isEarlyAccess) {
      const data = await this.steamService.fetchEarlyAccessReleaseDate(
        entityOwner.steamId,
      );

      if (!data?.releaseDate) return;

      console.log("earlyAccess", data);

      if (data.releaseDate !== meta.releaseDate)
        await this.handleReleaseDateChange(data, meta, entityOwner, true);
    }

    const daysUntilRelease = meta.releaseDate
      ? getDaysUntilRelease(meta.releaseDate)
      : null;
    const shouldFetchReleaseTime =
      daysUntilRelease !== null && daysUntilRelease <= 1;

    if (meta.comingSoon && shouldFetchReleaseTime) {
      const data = await this.steamService.fetchComingSoonReleaseDate(
        entityOwner.steamId,
      );

      if (!data?.releaseDate) return;

      if (
        data.releaseDate !== meta.releaseDate ||
        (data.releaseDate === meta.releaseDate && !meta.releaseTime)
      )
        await this.handleReleaseDateChange(data, meta, entityOwner, false);
    }
  }

  private async handleReleaseDateChange(
    data: ReleaseDateDataResponse,
    meta: GameMeta,
    entity: Game | Additions,
    shouldNotifyUser: boolean,
  ) {
    if (shouldNotifyUser) {
      const users =
        meta.type === GameMetaType.GAME
          ? meta.game!.users
          : meta.addition!.game.users;

      const formatedReleaseDate = formatReleaseDate(data.releaseDate!);

      const message = this.createEarlyAccessReleaseMessage(
        entity,
        formatedReleaseDate,
      );

      await this.sendMessageAboutReleaseDateForUsers(users, message);
    }

    await this.metaService.upsertReleaseDate(
      meta,
      data.releaseDate!,
      data.releaseTime,
      true,
    );
  }

  private async sendMessageAboutReleaseDateForUsers(
    users: User[],
    message: string,
  ) {
    await Promise.all(
      users.map(async (user) => {
        try {
          await this.telegramService.sendAutoMessageToUser(
            user.userId,
            message,
          );
        } catch (error) {
          console.error(
            "Произошла ошибка с асинхронным отправкой сообщений",
            error,
          );
        }
      }),
    );
  }

  private createEarlyAccessReleaseMessage(
    entity: Game | Additions,
    releaseDate: string,
  ): string {
    return [
      "🎉 *Найдена дата выхода из раннего доступа!*",
      "",
      `🎮 *Игра:* ${entity.name}`,
      `📅 *Дата выхода версии 1.0:* ${releaseDate}`,
      "",
      `🔗 ${entity.href}`,
    ].join("\n");
  }
}

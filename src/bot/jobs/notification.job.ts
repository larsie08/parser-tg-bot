import { Telegraf } from "telegraf";

import { TelegramService } from "../telegram.service";
import {
  Additions,
  Game,
  GameMeta,
  GameMetaService,
  GameMetaType,
  User,
} from "../../modules";

import { getDaysUntilRelease } from "../../shared";

import { Command, IBotContext } from "../";

export class NotificationJob extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameMetaService: GameMetaService,
    private readonly telegramService: TelegramService,
  ) {
    super(bot);
  }

  async handle(): Promise<void> {
    setInterval(
      async () => {
        const gamesMeta =
          await this.gameMetaService.getGamesWithUpcomingReleaseForJob();

        if (!gamesMeta) return console.log("Не найдено ни одной игры.");

        for (const gameMeta of gamesMeta) {
          try {
            const entityOwner = gameMeta[gameMeta.type];

            if (!entityOwner || !gameMeta.releaseDate) continue;

            const releaseDays = getDaysUntilRelease(gameMeta.releaseDate);

            if (
              releaseDays !== null &&
              this.shouldSendNotification(releaseDays)
            ) {
              const users =
                gameMeta.type === GameMetaType.GAME
                  ? gameMeta.game!.users
                  : gameMeta.addition!.game.users;

              await this.sendMessageAboutGameReleases(
                users,
                entityOwner,
                gameMeta,
                releaseDays,
              );
            }
          } catch (error) {
            console.error(
              `Ошибка обработки релизов игр для пользователей. ${gameMeta[gameMeta.type]?.name}:`,
            );
          }
        }
      },
      24 * 60 * 60 * 1000,
    );
  }

  private async sendMessageAboutGameReleases(
    users: User[],
    entityOwner: Game | Additions,
    meta: GameMeta,
    releaseDays: number,
  ): Promise<void> {
    const message = this.createReleaseCountdownMessage(
      entityOwner,
      meta,
      releaseDays,
    );

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

  private createReleaseCountdownMessage(
    entityOwner: Game | Additions,
    meta: GameMeta,
    daysUntilRelease: number,
  ): string {
    const word = this.getDaysWord(daysUntilRelease);

    const releaseQualifier = meta.isEarlyAccess ? " из раннего доступа" : "";
    const ownerType = meta.type === GameMetaType.GAME ? "Игра" : "Дополнение";

    const createDaysMessage = () => {
      let message = "";

      if (daysUntilRelease > 1)
        message = `📅 До выхода${releaseQualifier} осталось *${daysUntilRelease}* ${word}.`;
      if (daysUntilRelease === 1)
        message = `${ownerType} выходит${releaseQualifier} завтра`;
      if (daysUntilRelease === 0)
        message = `${ownerType} выходит${releaseQualifier} сегодня`;

      return message;
    };

    return [
      `🎮 *${entityOwner.name}*`,
      "",
      createDaysMessage(),
      entityOwner.href ? `🔗 [Страница Steam](${entityOwner.href})` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private getDaysWord(days: number): string {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    if (
      lastDigit >= 2 &&
      lastDigit <= 4 &&
      (lastTwoDigits < 12 || lastTwoDigits > 14)
    ) {
      return "дня";
    }

    return "дней";
  }

  private shouldSendNotification(releaseDate: number): boolean {
    const releaseNotifications = [30, 14, 7, 3, 1, 0];

    return releaseNotifications.includes(releaseDate);
  }
}

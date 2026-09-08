import { Telegraf } from "telegraf";

import { TelegramService } from "../telegram.service";
import {
  Additions,
  Game,
  GameMetaService,
  GameMetaType,
  needsReleaseTracking,
  User,
} from "../../modules";

import { Command, IBotContext } from "../../context";
import { getDaysUntilRelease } from "../../shared";

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
        const gamesMeta = await this.gameMetaService.getGamesIsComingSoon();

        if (!gamesMeta) return console.log("Не найдено ни одной игры.");

        for (const gameMeta of gamesMeta) {
          try {
            const owner = gameMeta[gameMeta.type];

            if (!owner || !gameMeta.releaseDate) return;

            const releaseDays = getDaysUntilRelease(gameMeta.releaseDate);

            if (releaseDays && this.shouldSendNotification(releaseDays)) {
              const users =
                gameMeta.type === GameMetaType.GAME
                  ? gameMeta.game!.users
                  : gameMeta.addition!.game.users;

              await this.sendMessageAboutGameReleases(
                users,
                owner,
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
    owner: Game | Additions,
    releaseDays: number,
  ): Promise<void> {
    const message = this.createReleaseCountdownMessage(owner, releaseDays);

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
    game: Game | Additions,
    daysUntilRelease: number,
  ): string {
    const isAddition = game.meta?.type === GameMetaType.ADDITION;
    const entityName = isAddition ? "Дополнение" : "Игра";

    if (daysUntilRelease === 0 && needsReleaseTracking(game.meta)) {
      return `🎮 *${game.name}*\n\n🎉 ${entityName} уже вышло!`;
    }

    const word = this.getDaysWord(daysUntilRelease);

    return [
      `🎮 *${game.name}*`,
      "",
      `📅 До выхода осталось *${daysUntilRelease}* ${word}.`,
      game.href ? `🔗 [Страница Steam](${game.href})` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private getDaysWord(days: number): string {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return "день";
    }

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
    const releaseNotifications = [30, 14, 7, 3, 1];

    return releaseNotifications.includes(releaseDate);
  }
}

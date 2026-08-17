import { Telegraf } from "telegraf";

import { TelegramService } from "../services";
import { Game, GameMetaService, needsReleaseTracking } from "../modules";

import { Command, IBotContext } from "../context";
import { getDaysUntilRelease } from "../shared";

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
        const games = await this.gameMetaService.getGamesIsComingSoon();

        if (!games) return;

        for (const gameMeta of games) {
          if (!gameMeta.releaseDate) continue;

          const releaseDays = getDaysUntilRelease(gameMeta.releaseDate);

          if (releaseDays && this.shouldSendNotification(releaseDays)) {
            const message = this.createReleaseCountdownMessage(
              gameMeta.game,
              releaseDays,
            );

            await Promise.all(
              gameMeta.game.users.map(async (user) => {
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
      },
      24 * 60 * 60 * 1000,
    );
  }

  private createReleaseCountdownMessage(
    game: Game,
    daysUntilRelease: number,
  ): string {
    if (daysUntilRelease === 0 && needsReleaseTracking(game.meta)) {
      return `🎮 *${game.name}*\n\n🎉 Игра уже вышла!`;
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

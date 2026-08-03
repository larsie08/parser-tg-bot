import { Telegraf } from "telegraf";

import { GameMetaService } from "../services";
import {
  getDaysUntilRelease,
  needsReleaseTracking,
  sendAutoMessageToUser,
} from "../utils";

import { Command, IBotContext } from "../context";
import { Game } from "../entities";

export class NotificationModule extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private gameMetaService: GameMetaService,
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

          const game = gameMeta.game;
          const releaseDays = getDaysUntilRelease(gameMeta.releaseDate);
          const message = this.createReleaseCountdownMessage(game, releaseDays);

          await Promise.all(
            game.users.map((user) => {
              try {
                sendAutoMessageToUser(user.userId, this.bot, message);
              } catch (error) {
                console.error(
                  "Произошла ошибка с асинхронным отправлением сообщений.",
                  error,
                );
              }
            }),
          );
        }
      },
      24 * 60 * 60 * 1000,
    );
  }

  private createReleaseCountdownMessage(
    game: Game,
    daysUntilRelease: number | null,
  ): string {
    if (daysUntilRelease === null) {
      return `🎮 *${game.name}*\n\n❌ Не удалось определить дату выхода.`;
    }

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
}

import { Telegraf } from "telegraf";

import { TelegramService } from "../telegram.service";
import { SteamService } from "../../integrations";

import { Game, GameMetaService, GameService, hasMetaData } from "../../modules";

import { formatReleaseDate } from "../../shared";

import { Command, IBotContext } from "../../context";

export class EarlyAccessReleaseDateJob extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameService: GameService,
    private readonly metaService: GameMetaService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
  ) {
    super(bot);
  }

  async handle(): Promise<void> {
    setInterval(
      async () => {
        const games = await this.gameService.getGamesWithEarlyAccess();

        if (!games) return console.log("Не найдено ни одной игры.");

        for (const game of games) {
          try {
            await this.processEarlyReleaseDate(game);
          } catch (error) {
            console.error(
              `Ошибка обработки игр для пользователей. ${game.name}:`,
              error,
            );
          }
        }
      },
      24 * 60 * 60 * 1000,
    );
  }

  private async processEarlyReleaseDate(game: Game): Promise<void> {
    if (hasMetaData(game.meta) && game.meta.comingSoon) return;

    if (game.meta.isEarlyAccess) {
      const releaseDate = await this.steamService.fetchEarlyAccessReleaseDate(
        game.steamId,
      );

      if (!releaseDate) return;

      if (releaseDate !== game.meta.releaseDate) {
        const formatedReleaseDate = formatReleaseDate(releaseDate);

        await Promise.all(
          game.users.map(async (user) => {
            try {
              await this.telegramService.sendAutoMessageToUser(
                user.userId,
                this.createEarlyAccessReleaseMessage(game, formatedReleaseDate),
              );
            } catch (error) {
              console.error(
                "Произошла ошибка с асинхронным отправкой сообщений",
                error,
              );
            }
          }),
        );

        await this.metaService.upsertEarlyReleaseInfo(game.meta, releaseDate);
      }
    }
  }

  private createEarlyAccessReleaseMessage(
    game: Game,
    releaseDate: string,
  ): string {
    return [
      "🎉 *Найдена дата выхода из раннего доступа!*",
      "",
      `🎮 *Игра:* ${game.name}`,
      `📅 *Дата выхода версии 1.0:* ${releaseDate}`,
      "",
      `🔗 ${game.href}`,
    ].join("\n");
  }
}

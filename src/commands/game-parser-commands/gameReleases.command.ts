import { Telegraf } from "telegraf";

import { GameMetaService, SteamService } from "../../services";
import {
  formatReleaseDate,
  sendAndDeleteWithTimeout,
  sendAndTrackMessage,
} from "../../utils";

import { Command, IBotContext } from "../../context";
import { GameMeta } from "../../entities";

export class GameReleasesCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private gameMetaService: GameMetaService,
    private steamService: SteamService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_releases_start", async (context: IBotContext) => {
      const games = await this.gameMetaService.getGamesWithUpcomingRelease(
        context.session.user!.id,
      );

      const gamesWithoutReleaseDate = games.filter(
        (game) => game.releaseDate === null || game.releaseDate === undefined,
      );

      let gamesWithReleaseDate: GameMeta[] = [
        ...games.filter((gameMeta) => gameMeta.releaseDate),
      ];

      console.log(gamesWithReleaseDate);

      if (gamesWithoutReleaseDate) {
        for (const gameMeta of gamesWithoutReleaseDate) {
          const releaseDate = await this.searchReleaseDate(gameMeta);

          if (!releaseDate) continue;

          gameMeta.releaseDate = releaseDate;
          gamesWithReleaseDate.push(gameMeta);

          await this.gameMetaService.upsertReleaseDate(gameMeta, releaseDate);
        }
      }

      await Promise.all(
        gamesWithReleaseDate.map((gameMeta) => {
          const releaseDate = formatReleaseDate(gameMeta.releaseDate!);

          try {
            sendAndDeleteWithTimeout(
              context,
              this.createUpcomingReleaseMessage(gameMeta, releaseDate),
              10 * 60 * 1000,
            );
          } catch (error) {
            console.error(
              "Произошла ошибка с асинхронной отправкой сообщения",
              error,
            );
          }
        }),
      );
    });
  }

  private async searchReleaseDate(gameMeta: GameMeta): Promise<string | null> {
    let releaseDate: string | null = null;

    if (gameMeta.isEarlyAccess && !gameMeta.comingSoon) {
      const data = await this.steamService.fetchEarlyAccessReleaseDate(
        gameMeta.game.steamId,
      );

      if (data) releaseDate = data;
    }

    if (gameMeta.comingSoon && !gameMeta.isEarlyAccess) {
      const data = await this.steamService.fetchGameMetaInfoRegionalSteam(
        gameMeta.game.steamId,
      );

      if (data?.releaseDate) releaseDate = data.releaseDate;
    }

    return releaseDate;
  }

  private createUpcomingReleaseMessage(
    gameMeta: GameMeta,
    formatedReleaseDate: string,
  ): string {
    const message: string[] = [];

    if (gameMeta.comingSoon) {
      message.push("🚀 *Найдена дата выхода игры!*");
    } else if (gameMeta.isEarlyAccess) {
      message.push("🎉 *Найдена дата выхода из раннего доступа!*");
    }

    message.push("");
    message.push(`🎮 *Игра:* ${gameMeta.game.name}`);

    if (gameMeta.releaseDate) {
      message.push(`📅 *Дата релиза:* ${formatedReleaseDate}`);
    }

    if (gameMeta.game.href) {
      message.push(`🔗 [Страница Steam](${gameMeta.game.href})`);
    }

    return message.join("\n");
  }
}

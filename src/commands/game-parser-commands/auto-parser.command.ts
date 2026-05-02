import { Telegraf } from "telegraf";

import {
  GameMetaService,
  GameService,
  NewsService,
  SteamService,
} from "../../services";
import {
  compareNewNews,
  createGameMessage,
  createNewsMessage,
  filterRelevantNews,
} from "../../utils";

import { Game } from "../../entities";
import { Command, IBotContext, IGameSteamData } from "../../context";

export class AutoParserCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private gameService: GameService,
    private gameMetaService: GameMetaService,
    private newsService: NewsService,
    private steamService: SteamService,
  ) {
    super(bot);
  }

  async handle(): Promise<void> {
    setInterval(
      async () => {
        const games = await this.gameService.getGamesOfUsers();

        if (!games) throw new Error("Не найдено ни одной игры.");

        for (const game of games) {
          try {
            await this.autoParser(game);
          } catch (error) {
            throw new Error(
              `Ошибка обработки игр для пользователей. ${game.users}:`,
            );
          }
        }
      },
      30 * 60 * 1000,
    );
  }

  private async autoParser(game: Game): Promise<void> {
    try {
      const steamGameData = await this.steamService.fetchGameInfoSteam(
        game.steamId,
      );

      if (!steamGameData)
        throw new Error(`Ошибка при обработке игры ${game.name}:`);

      this.processSteamGame(steamGameData, game);
      this.processGameNews(game);
    } catch (error) {
      throw new Error(`Ошибка при обработке игры ${game.name}:`);
    }
  }

  private async processSteamGame(
    steamGameData: IGameSteamData,
    game: Game,
  ): Promise<void> {
    const changesDetected = await this.getDiffData(game, steamGameData);
    const hasAnyChange = Object.values(changesDetected).length;

    if (game.meta || hasAnyChange === 0) return;

    await this.gameMetaService.upsertMetaInfo(steamGameData, game);

    const message = createGameMessage(steamGameData, changesDetected);

    for (const user of game.users)
      await this.bot.telegram.sendMessage(user.userId, message);
  }

  private async getDiffData(
    game: Game,
    steamGameData: IGameSteamData,
  ): Promise<Partial<IGameSteamData>> {
    const changes: Partial<IGameSteamData> = {};
    const meta: Partial<IGameSteamData> =
      (await this.gameMetaService.getMetaInfo(game)) ?? {};

    for (const key of Object.keys(steamGameData) as (keyof IGameSteamData)[]) {
      if (key === "name" || key === "href") continue;

      const newValue = steamGameData[key] ?? undefined;
      const metaNewValue = meta[key] ?? undefined;

      if (
        (key === "releaseDate" && metaNewValue !== newValue) ||
        (key === "releaseTime" && metaNewValue !== newValue)
      ) {
        changes[key] = newValue;
        continue;
      }

      if (metaNewValue !== newValue) {
        changes[key] = newValue;
      }
    }

    return changes;
  }

  private async processGameNews(game: Game): Promise<void> {
    const newsData = await this.steamService.fetchGameNews(game.steamId);

    if (!newsData) {
      return console.log(`Не удалось получить новости для игры: ${game.name}`);
    }

    const filteredNews = filterRelevantNews(newsData);

    const existedNews = await compareNewNews(filteredNews, game.steamId);

    for (const news of existedNews.appnews.newsitems) {
      await this.newsService.saveNewsGame(news.title, news.gid, game);
    }

    if (existedNews.appnews.newsitems.length > 0) {
      for (const user of game.users) {
        for (const news of existedNews.appnews.newsitems) {
          const message = createNewsMessage(
            news,
            game.name,
            existedNews.appnews.newsitems,
          );

          await this.bot.telegram.sendMessage(user.userId, message);
        }
      }
    }
  }
}

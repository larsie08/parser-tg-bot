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

import { Game, GameMeta } from "../../entities";
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
            await this.handleAutoParser(game);
          } catch (error) {
            throw new Error(
              `Ошибка обработки игр для пользователей. ${game.users}:`,
            );
          }
        }
      },
      // 30 * 60 * 1000,
      30000,
    );
  }

  private async handleAutoParser(game: Game): Promise<void> {
    try {
      const steamGameData = await this.steamService.fetchGameMetaInfoSteam(
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
    const changesDetected = this.getDiffData(game, steamGameData);
    const hasAnyChange = Object.values(changesDetected).length;

    const hasMetaData =
      game.meta != null && Object.values(game.meta).some((v) => v != null);

    if (hasAnyChange === 0) return;

    if (hasMetaData) {
      const message = createGameMessage(steamGameData, changesDetected);

      for (const user of game.users)
        await this.bot.telegram.sendMessage(user.userId, message);
    }

    await this.gameMetaService.upsertMetaInfo(steamGameData, game);
  }

  private async processGameNews(game: Game): Promise<void> {
    const fetchedNews = await this.steamService.fetchGameNews(game.steamId);

    if (!fetchedNews) {
      return console.log(`Не удалось получить новости для игры: ${game.name}`);
    }

    const filteredNews = filterRelevantNews(fetchedNews);

    const news = await this.newsService.getNewsGame(game.steamId);

    const existedNews = await compareNewNews(filteredNews, news);

    if (existedNews.appnews.newsitems.length > 0 && news.length !== 0) {
      for (const user of game.users) {
        for (const newsItem of existedNews.appnews.newsitems) {
          const message = createNewsMessage(
            newsItem,
            game.name,
            existedNews.appnews.newsitems,
          );

          await this.bot.telegram.sendMessage(user.userId, message);
        }
      }
    }

    for (const news of existedNews.appnews.newsitems) {
      await this.newsService.saveNewsGame(news.title, news.gid, game);
    }
  }

  private getDiffData(
    game: Game,
    steamGameData: IGameSteamData,
  ): Partial<IGameSteamData> {
    const changes: Partial<IGameSteamData> = {};
    const meta: Partial<IGameSteamData> = game.meta ?? {};

    const deniedKeys = ["name", "href", "oldPrice"];

    for (const key of Object.keys(steamGameData) as (keyof IGameSteamData)[]) {
      if (deniedKeys.includes(key)) continue;

      const newValue = steamGameData[key] ?? undefined;
      const metaNewValue = meta[key] ?? undefined;

      if (metaNewValue !== newValue) {
        changes[key] = newValue;
      }
    }

    return changes;
  }
}

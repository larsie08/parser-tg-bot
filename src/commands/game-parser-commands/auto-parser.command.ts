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

import { Game, GameMeta, User } from "../../entities";
import {
  Command,
  GameNewsInfo,
  IBotContext,
  IGameSteamData,
} from "../../context";

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
            await this.processSteamGame(game);
            await this.processGameNews(game);
          } catch (error) {
            console.error(
              `Ошибка обработки игр для пользователей. ${game.name}:`,
            );
          }
        }
      },
      30 * 60 * 1000,
    );
  }

  private async processSteamGame(game: Game): Promise<void> {
    const steamGameData = await this.steamService.fetchGameMetaInfoSteam(
      game.steamId,
    );

    if (!steamGameData)
      return console.log(`Ошибка при обработке игры ${game.name}`);

    const changesDetected = this.getDiffData(game, steamGameData);
    const hasAnyChange = Object.values(changesDetected).length > 0;

    if (!hasAnyChange) return;

    if (this.hasMetaData(game.meta) && hasAnyChange) {
      for (const user of game.users) {
        await this.sendMessageUser(user, () =>
          createGameMessage(steamGameData, changesDetected),
        );
      }
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
      await this.processSendMessageNews(game, existedNews);
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

  private async processSendMessageNews(game: Game, existedNews: GameNewsInfo) {
    for (const user of game.users) {
      for (const newsItem of existedNews.appnews.newsitems) {
        await this.sendMessageUser(user, () =>
          createNewsMessage(newsItem, game.name, existedNews.appnews.newsitems),
        );
      }
    }
  }

  private async sendMessageUser(user: User, createMessage: () => string) {
    const message = createMessage();

    await this.bot.telegram.sendMessage(user.userId, message);
  }

  private hasMetaData(meta: GameMeta | null): boolean {
    if (!meta) return false;

    const keys: (keyof GameMeta)[] = [
      "price",
      "discount",
      "releaseDate",
      "releaseTime",
    ];

    return keys.some((key) => {
      const value = meta[key];
      return value != null && value !== "";
    });
  }
}

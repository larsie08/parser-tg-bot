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
  getDiffData,
  hasMetaData,
} from "../../utils";

import { Game } from "../../entities";
import {
  Command,
  FilteredUsersNewsPreference,
  GameNewsInfo,
  IBotContext,
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
        const games = await this.gameService.getGamesOfUsersWithSubscriptions();

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
    const steamGameData =
      await this.steamService.fetchGameMetaInfoRegionalSteam(game.steamId);

    if (!steamGameData)
      return console.log(`Ошибка при обработке игры ${game.name}`);

    const changesDetected = getDiffData(game, steamGameData);
    const hasAnyChange = Object.values(changesDetected).length > 0;

    if (!hasAnyChange) return;

    if (hasMetaData(game.meta) && hasAnyChange) {
      for (const user of game.users) {
        await this.sendMessageUser(user.userId, () =>
          createGameMessage(steamGameData, game, changesDetected),
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

    const news = await this.newsService.getNewsGame(game.steamId);

    const existedNews = await compareNewNews(fetchedNews, news);

    const usersNews = await this.filterUsersSubscriptionsNews(
      game,
      existedNews,
    );

    if (!usersNews)
      return console.log(
        "Произошла ошибка с фильтрацией новостей пользователя.",
      );

    if (existedNews.appnews.newsitems.length > 0 && news.length !== 0) {
      await this.processSendMessageNews(game.name, usersNews, existedNews);
    }

    for (const news of existedNews.appnews.newsitems) {
      await this.newsService.saveNewsGame(news.title, news.gid, game);
    }
  }

  private async filterUsersSubscriptionsNews(
    game: Game,
    news: GameNewsInfo,
  ): Promise<FilteredUsersNewsPreference[] | null> {
    const usersNews: FilteredUsersNewsPreference[] = [];

    for (const user of game.users) {
      const gameSub = user.gameSubscriptions.find((s) => s.game.id === game.id);

      usersNews.push({
        userId: user.userId,
        news: filterRelevantNews(news, gameSub ?? user.UserNewsSubscription),
      });
    }

    return usersNews;
  }

  private async processSendMessageNews(
    gameName: string,
    usersNews: FilteredUsersNewsPreference[],
    existedNews: GameNewsInfo,
  ): Promise<void> {
    for (const user of usersNews) {
      for (const newsItem of user.news.appnews.newsitems) {
        await this.sendMessageUser(user.userId, () =>
          createNewsMessage(newsItem, gameName, existedNews.appnews.newsitems),
        );
      }
    }
  }

  private async sendMessageUser(userId: number, createMessage: () => string) {
    const message = createMessage();

    await this.bot.telegram.sendMessage(userId, message);
  }
}

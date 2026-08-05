import { Telegraf } from "telegraf";

import {
  GameMetaService,
  GameService,
  NewsService,
  SteamService,
} from "../services";
import {
  compareNewNews,
  createEarlyAccessReleaseMessage,
  createGameMessage,
  createNewsMessage,
  filterRelevantNews,
  getDiffData,
  hasMetaData,
  sendAutoMessageToUser,
  shouldCheckSteamPage,
} from "../utils";

import { Game, GameMeta } from "../entities";
import {
  Command,
  FilteredUsersNewsPreference,
  GameNewsInfo,
  IBotContext,
} from "../context";

export class AutoParserModule extends Command {
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

        if (!games) return console.log("Не найдено ни одной игры.");

        for (const game of games) {
          try {
            await this.processSteamGame(game);
            await this.processGameNews(game);
            await this.processEarlyReleaseDate(game);
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

    if (hasMetaData(game.meta) && !hasAnyChange) return;

    if (hasMetaData(game.meta) && hasAnyChange) {
      await Promise.all(
        game.users.map((user) => {
          try {
            sendAutoMessageToUser(
              user.userId,
              this.bot,
              createGameMessage(steamGameData, game, changesDetected),
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
      await this.sendMessageNews(game.name, usersNews, existedNews);
    }

    for (const news of existedNews.appnews.newsitems) {
      await this.newsService.saveNewsGame(news.title, news.gid, game);
    }
  }

  private async processEarlyReleaseDate(game: Game): Promise<void> {
    if (game.meta.comingSoon) return;

    if (
      game.meta.isEarlyAccess &&
      shouldCheckSteamPage(game.meta.lastSteamPageCheck)
    ) {
      const releaseDate = await this.steamService.fetchEarlyAccessReleaseDate(
        game.steamId,
      );

      if (!releaseDate) return;

      const gameMeta = await this.gameMetaService.getMetaInfo(game.id);

      if (!gameMeta) return;

      if (releaseDate !== gameMeta.releaseDate) {
        await Promise.all(
          game.users.map((user) => {
            try {
              sendAutoMessageToUser(
                user.userId,
                this.bot,
                createEarlyAccessReleaseMessage(game, releaseDate),
              );
            } catch (error) {
              console.error(
                "Произошла ошибка с асинхронным отправкой сообщений",
                error,
              );
            }
          }),
        );

        await this.gameMetaService.upsertEarlyReleaseInfo(
          game.meta,
          releaseDate,
        );
      }
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

  private async sendMessageNews(
    gameName: string,
    usersNews: FilteredUsersNewsPreference[],
    existedNews: GameNewsInfo,
  ): Promise<void> {
    for (const user of usersNews) {
      await Promise.all(
        user.news.appnews.newsitems.map((news) => {
          try {
            sendAutoMessageToUser(
              user.userId,
              this.bot,
              createNewsMessage(news, gameName, existedNews.appnews.newsitems),
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
}

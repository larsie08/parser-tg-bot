import { Telegraf } from "telegraf";

import { TelegramService } from "../telegram.service";
import { SteamService } from "../../integrations";

import {
  Additions,
  AdditionsService,
  compareNewNews,
  createAdditionMessage,
  createGameMessage,
  createNewAdditionMessage,
  createNewsMessage,
  FilteredUsersNewsPreference,
  filterRelevantNews,
  Game,
  GameMeta,
  GameMetaType,
  GameNewsInfo,
  GameService,
  getAdditionDiffData,
  getDiffData,
  hasMetaData,
  IGameSteamData,
  NewsService,
  PriceHistoryService,
  PriceTrackingService,
  User,
} from "../../modules";

import { formatReleaseDate } from "../../shared";

import { Command, IBotContext } from "../../context";

export class AutoParserJob extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameService: GameService,
    private readonly newsService: NewsService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
    private readonly additionsService: AdditionsService,
    private readonly priceTrackingService: PriceTrackingService,
    private readonly priceHistoryService: PriceHistoryService,
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
            await this.processGameAdditions(game);
          } catch (error) {
            console.error(
              `Ошибка обработки игр для пользователей. ${game.name}:`,
              error,
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
    const changesKeys = Object.keys(
      changesDetected,
    ) as (keyof IGameSteamData)[];

    if (hasMetaData(game.meta) && !hasAnyChange) return;

    if (changesKeys.includes("dlc") && changesDetected.dlc) {
      const isFirstAdditionsSync = game.additions.length === 0;

      for (const steamId of changesDetected.dlc) {
        const additionInfo =
          await this.steamService.fetchGameMetaInfoRegionalSteam(steamId);

        if (!additionInfo) continue;

        const addition = await this.additionsService.saveAddition(
          additionInfo,
          game,
          steamId,
        );

        if (isFirstAdditionsSync) continue;

        await this.sendMessageAboutGameChanges(
          game,
          GameMetaType.ADDITION,
          game.users,
          additionInfo,
          changesDetected,
          true,
          false,
          false,
          "",
          addition,
        );
      }
    }

    if (hasMetaData(game.meta) && !changesKeys.includes("dlc")) {
      const isGameNowReleased = this.hasGameReleased(
        steamGameData,
        game.meta,
        changesKeys,
      );

      const lowestPriceInHistory =
        await this.priceHistoryService.getLowestPriceInHistory(game.meta.id);

      const isLowestPrice =
        lowestPriceInHistory != null &&
        steamGameData.price != null &&
        steamGameData.price < lowestPriceInHistory.price;

      const releaseDate = changesKeys.includes("releaseDate")
        ? (() => {
            const date = steamGameData.releaseDate ?? game.meta.releaseDate;
            return date ? formatReleaseDate(date) : undefined;
          })()
        : undefined;

      await this.sendMessageAboutGameChanges(
        game,
        GameMetaType.GAME,
        game.users,
        steamGameData,
        changesDetected,
        false,
        isLowestPrice,
        isGameNowReleased,
        releaseDate,
      );
    }

    await this.priceTrackingService.processSaveMetaInfoAndHistory(
      steamGameData,
      game.id,
      GameMetaType.GAME,
    );
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

  private async processGameAdditions(game: Game): Promise<void> {
    const additions = await this.additionsService.getGameAllAdditions(game.id);

    if (!additions) return;

    for (const additionItem of additions) {
      const additionData =
        await this.steamService.fetchGameMetaInfoRegionalSteam(
          additionItem.steamId,
        );

      if (!additionData) continue;

      const changesDetected = getAdditionDiffData(additionItem, additionData);
      const hasAnyChange = Object.values(changesDetected).length > 0;
      const changesKeys = Object.keys(
        changesDetected,
      ) as (keyof IGameSteamData)[];

      if (!hasAnyChange) continue;

      if (hasMetaData(additionItem.meta) && hasAnyChange) {
        const lowestPriceInHistory =
          await this.priceHistoryService.getLowestPriceInHistory(game.meta.id);

        const isLowestPrice =
          lowestPriceInHistory != null &&
          additionData.price != null &&
          additionData.price < lowestPriceInHistory.price;

        const isGameNowReleased = this.hasGameReleased(
          additionData,
          game.meta,
          changesKeys,
        );

        const releaseDate = changesKeys.includes("releaseDate")
          ? (() => {
              const date =
                additionData.releaseDate ?? additionItem.meta.releaseDate;
              return date ? formatReleaseDate(date) : undefined;
            })()
          : undefined;

        await this.sendMessageAboutGameChanges(
          game,
          GameMetaType.ADDITION,
          game.users,
          additionData,
          changesDetected,
          false,
          isLowestPrice,
          isGameNowReleased,
          releaseDate,
          additionItem,
        );
      }

      await this.priceTrackingService.processSaveMetaInfoAndHistory(
        additionData,
        additionItem.id,
        GameMetaType.ADDITION,
      );
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

  private async sendMessageAboutGameChanges(
    game: Game,
    type: GameMetaType,
    users: User[],
    steamGameData: IGameSteamData,
    changesDetected: Partial<IGameSteamData>,
    isNewAddition: boolean,
    isLowestPrice: boolean = false,
    isGameReleased: boolean = false,
    releaseDate?: string | undefined,
    addition?: Additions,
  ) {
    let message = "";

    if (type === GameMetaType.GAME) {
      message = createGameMessage(
        steamGameData,
        game,
        changesDetected,
        releaseDate,
        isLowestPrice,
        isGameReleased,
      );
    } else if (type === GameMetaType.ADDITION && addition && isNewAddition) {
      message = createNewAdditionMessage(addition, game);
    } else if (type === GameMetaType.ADDITION && addition) {
      message = createAdditionMessage(
        steamGameData,
        addition,
        game,
        changesDetected,
        releaseDate,
      );
    }

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

  private async sendMessageNews(
    gameName: string,
    usersNews: FilteredUsersNewsPreference[],
    existedNews: GameNewsInfo,
  ): Promise<void> {
    for (const user of usersNews) {
      await Promise.all(
        user.news.appnews.newsitems.map(async (news) => {
          try {
            await this.telegramService.sendAutoMessageToUser(
              user.userId,
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

  private hasGameReleased(
    gameData: IGameSteamData,
    meta: GameMeta,
    changesKeys: (keyof IGameSteamData)[],
  ): boolean {
    const earlyAccessEnded =
      changesKeys.includes("isEarlyAccess") &&
      meta.isEarlyAccess === true &&
      gameData.isEarlyAccess === false;

    const comingSoonEnded =
      changesKeys.includes("comingSoon") &&
      meta.comingSoon === true &&
      gameData.comingSoon === false &&
      gameData.isEarlyAccess === false;

    return earlyAccessEnded || comingSoonEnded;
  }
}

import { Telegraf } from "telegraf";

import { TelegramService } from "../telegram.service";
import { SteamService } from "../../integrations";
import {
  Additions,
  AdditionsService,
  compareNewNews,
  createAdditionMessage,
  createNewAdditionMessage,
  FilteredUsersNewsPreference,
  filterRelevantNews,
  Game,
  GameMetaService,
  GameMetaType,
  GameNewsInfo,
  GameService,
  getAdditionDiffData,
  getDiffData,
  hasMetaData,
  IGameSteamData,
  NewsService,
  User,
} from "../../modules";

import {
  createGameMessage,
  createNewsMessage,
  formatReleaseDate,
  shouldCheckSteamPage,
} from "../../shared";

import { Command, IBotContext } from "../../context";

export class AutoParserJob extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameService: GameService,
    private readonly gameMetaService: GameMetaService,
    private readonly newsService: NewsService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
    private readonly additionsService: AdditionsService,
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
    const changesKeys = Object.keys(changesDetected);

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
          "",
          addition,
        );
      }
    }

    if (hasMetaData(game.meta) && !changesKeys.includes("dlc")) {
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
        releaseDate,
      );
    }

    await this.gameMetaService.upsertMetaInfo(
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

  private async processEarlyReleaseDate(game: Game): Promise<void> {
    if (game.meta && game.meta.comingSoon) return;

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
          game.users.map(async (user) => {
            try {
              await this.telegramService.sendAutoMessageToUser(
                user.userId,
                this.createEarlyAccessReleaseMessage(game, releaseDate),
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
      const changesKeys = Object.keys(changesDetected);

      if (!hasAnyChange) continue;

      if (hasMetaData(additionItem.meta) && hasAnyChange) {
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
          releaseDate,
          additionItem,
        );
      }

      await this.gameMetaService.upsertMetaInfo(
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

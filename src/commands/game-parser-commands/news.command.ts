import { Markup, Telegraf } from "telegraf";

import {
  GameNewsSubscriptionService,
  GameService,
  NewsService,
  SteamService,
  UserNewsSubscriptionService,
} from "../../services";
import {
  cancelOperationMessage,
  compareNewNews,
  createNewsMessage,
  filterRelevantNews,
  getGameNameFromMessageCallback,
  notifyUserAboutError,
  sendAndTrackMessage,
  showGameSelectionMenu,
} from "../../utils";

import { Command, GameNewsInfo, IBotContext } from "../../context";
import { Game } from "../../entities";

export class GameNewsCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private newsService: NewsService,
    private gameService: GameService,
    private steamService: SteamService,
    private userNewsSubscriptionService: UserNewsSubscriptionService,
    private gameNewsSubscriptionService: GameNewsSubscriptionService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("news_check_start", async (context: IBotContext) => {
      const games = await this.gameService.getUserAllGames(
        context.session.user!.userId,
      );

      if (!games || games.length === 0)
        return notifyUserAboutError(
          context,
          "В списке отслеживаемого ничего не найдено.",
        );

      await showGameSelectionMenu(
        context,
        games,
        "gameNewsMessagesId",
        "Отменить проверку новостей.",
        Markup.inlineKeyboard([
          Markup.button.callback("Узнать новость", "news_check_game"),
        ]),
        Markup.inlineKeyboard([
          Markup.button.callback("Отменить", "news_check_cancel"),
        ]),
      );
    });

    this.bot.action("news_check_game", async (context) => {
      const gameNameFromMessage = getGameNameFromMessageCallback(context);

      if (!gameNameFromMessage)
        return notifyUserAboutError(context, "Ошибка при выборе игры.");

      const gameEntity =
        await this.gameService.getUserGame(gameNameFromMessage);

      if (!gameEntity) {
        return notifyUserAboutError(context, "Игра не найдена.");
      }

      const fetchedNews = await this.steamService.fetchGameNews(
        gameEntity.steamId,
      );

      if (!fetchedNews)
        return notifyUserAboutError(
          context,
          "Не удалось получить ни одной новости.",
        );

      const gameSubscription =
        await this.gameNewsSubscriptionService.getGameSubscriptions(
          context.session.user!.id,
          gameEntity.id,
        );

      const userSubscriptions =
        await this.userNewsSubscriptionService.getUserSubscriptions(
          context.session.user!.userId,
        );

      if (!userSubscriptions)
        return notifyUserAboutError(
          context,
          "Произошла ошибка с определением подписок",
        );

      const filteredNews = filterRelevantNews(
        fetchedNews,
        gameSubscription ? gameSubscription : userSubscriptions,
      );

      const existingNews = await this.newsService.getNewsGame(
        gameEntity.steamId,
      );

      const newsToSave = await compareNewNews(fetchedNews, existingNews);

      if (!fetchedNews)
        return notifyUserAboutError(context, "Новости не найдены.");

      await this.saveNewsToDB(newsToSave, gameEntity);

      await this.sendNewsToUser(context, filteredNews, gameEntity.name);
    });

    this.bot.action("news_check_cancel", async (context: IBotContext) => {
      await cancelOperationMessage(context, "gameNewsMessagesId", null);
    });
  }

  private async saveNewsToDB(news: GameNewsInfo, game: Game): Promise<void> {
    const newsItems = news.appnews.newsitems;

    for (const item of newsItems) {
      await this.newsService.saveNewsGame(item.title, item.gid, game);
    }
  }

  private async sendNewsToUser(
    context: IBotContext,
    news: GameNewsInfo,
    gameName: string,
  ): Promise<void> {
    if (news.appnews.newsitems.length === 0)
      return await notifyUserAboutError(
        context,
        "Не найдено ни одной новости\nСкорее всего новостей нет, согласно вашим настройкам.",
      );

    for (const item of news.appnews.newsitems) {
      await sendAndTrackMessage(
        context,
        createNewsMessage(item, gameName, news.appnews.newsitems),
        "gameNewsMessagesId",
      );
    }
  }
}

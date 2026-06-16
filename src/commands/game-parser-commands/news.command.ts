import { Markup, Telegraf } from "telegraf";

import {
  GameService,
  NewsService,
  SteamService,
  UserNewsSubscriptionService,
  UserService,
} from "../../services";
import {
  cancelOperationMessage,
  compareNewNews,
  createNewsMessage,
  filterRelevantNews,
  getGameNameFromMessageCallback,
  notifyUserAboutError,
  sendAndTrackMessage,
} from "../../utils";

import { Command, GameNewsInfo, IBotContext } from "../../context";
import { Game } from "../../entities";

export class GameNewsCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private newsService: NewsService,
    private userService: UserService,
    private gameService: GameService,
    private steamService: SteamService,
    private userNewsSubscriptionService: UserNewsSubscriptionService,
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

      await this.displayGames(context, games);
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

      const userSubscriptions =
        await this.userNewsSubscriptionService.getUserSubscriptions(
          context.session.user!.userId,
        );

      if (!userSubscriptions)
        return notifyUserAboutError(
          context,
          "Произошла ошибка с определением подписок",
        );

      const filteredNews = filterRelevantNews(fetchedNews, userSubscriptions);

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

  private async displayGames(
    context: IBotContext,
    games: Game[],
  ): Promise<void> {
    for (const game of games) {
      await sendAndTrackMessage(
        context,
        game.name,
        "gameNewsMessagesId",
        Markup.inlineKeyboard([
          Markup.button.callback("Узнать новость", "news_check_game"),
        ]),
      );
    }

    await sendAndTrackMessage(
      context,
      "Отменить проверку новостей.",
      "gameNewsMessagesId",
      Markup.inlineKeyboard([
        Markup.button.callback("Узнать новость", "news_check_cancel"),
      ]),
    );
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
    for (const item of news.appnews.newsitems) {
      await sendAndTrackMessage(
        context,
        createNewsMessage(item, gameName, news.appnews.newsitems),
        "gameNewsMessagesId",
      );
    }
  }
}

import { Telegraf } from "telegraf";

import { TelegramService } from "../../services";
import { SteamService } from "../../integrations";
import {
  compareNewNews,
  filterRelevantNews,
  Game,
  GameNewsInfo,
  GameService,
  NewsService,
} from "../../modules";
import { createNewsMessage, buildGamePaginationMarkUp } from "../../shared";

import { Command, IBotContext } from "../../context";

export class GameNewsCommand extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly newsService: NewsService,
    private readonly gameService: GameService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("news_check_start", async (context: IBotContext) => {
      const games = await this.gameService.getUserAllGames(
        context.session.user!.userId,
      );

      if (!games || games.length === 0)
        return this.telegramService.notifyUserAboutError(
          context,
          "В списке отслеживаемого ничего не найдено.",
        );

      const markup = buildGamePaginationMarkUp(games, 0, "news_check");

      await this.telegramService.sendAndTrackMessage(
        context,
        "📰 *Выберите игру:*",
        "gameNewsMessagesId",
        markup,
      );
    });

    this.bot.action(/^news_check_select:(\d+)$/, async (context) => {
      const gameId = Number(context.match?.[1]);

      if (!gameId)
        return this.telegramService.notifyUserAboutError(
          context,
          "Ошибка при выборе игры.",
        );

      const gameEntity =
        await this.gameService.getUserGameWithSubscriptions(gameId);

      if (!gameEntity) {
        return this.telegramService.notifyUserAboutError(
          context,
          "Игра не найдена.",
        );
      }

      const fetchedNews = await this.steamService.fetchGameNews(
        gameEntity.steamId,
      );

      if (!fetchedNews)
        return this.telegramService.notifyUserAboutError(
          context,
          "Не удалось получить ни одной новости.",
        );

      const gameSubscription = gameEntity.subscriptions.find(
        (sub) => sub.user.id === context.session.user!.id,
      );

      const filteredNews = filterRelevantNews(
        fetchedNews,
        gameSubscription
          ? gameSubscription
          : context.session.user!.UserNewsSubscription,
      );

      const existingNews = await this.newsService.getNewsGame(
        gameEntity.steamId,
      );

      const newsToSave = await compareNewNews(fetchedNews, existingNews);

      if (!fetchedNews)
        return this.telegramService.notifyUserAboutError(
          context,
          "Новости не найдены.",
        );

      await this.saveNewsToDB(newsToSave, gameEntity);

      await this.sendNewsToUser(context, filteredNews, gameEntity.name);
    });

    this.bot.action(
      /^news_check_toggle_page:(\d+)$/,
      async (context: IBotContext) => {
        const page = Number(context.match?.[1]);

        const games = await this.gameService.getUserAllGames(
          context.session.user!.userId,
        );

        await context.editMessageReplyMarkup(
          buildGamePaginationMarkUp(games, page, "news_check").reply_markup,
        );

        await context.answerCbQuery();
      },
    );

    this.bot.action("news_check_cancel", async (context: IBotContext) => {
      await this.telegramService.cancelOperationMessage(
        context,
        "gameNewsMessagesId",
        null,
      );
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
      return await this.telegramService.notifyUserAboutError(
        context,
        "Не найдено ни одной новости\nСкорее всего новостей нет, согласно вашим настройкам.",
      );

    for (const item of news.appnews.newsitems) {
      await this.telegramService.sendAndTrackMessage(
        context,
        createNewsMessage(item, gameName, news.appnews.newsitems),
        "gameNewsMessagesId",
      );
    }
  }
}

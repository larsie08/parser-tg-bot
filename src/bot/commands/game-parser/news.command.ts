import { Markup, Telegraf } from "telegraf";

import { TelegramService } from "../../telegram.service";
import { SteamService } from "../../../integrations";
import {
  buildGamePaginationMarkUp,
  buildNewsPaginationMarkUp,
  compareNewNews,
  filterRelevantNews,
  Game,
  GameNewsInfo,
  GameService,
  NewsService,
} from "../../../modules";
import { createNewsMessage } from "../../../shared";

import { Command, IBotContext } from "../../../context";

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
      context.session.filteredNews = null;

      await this.telegramService.cancelOperationMessage(
        context,
        "gameNewsMessagesId",
        null,
      );
    });

    this.bot.action(
      /^news_check_select:(\d+)$/,
      async (context: IBotContext) => {
        const gameId = Number(context.match?.[1]);

        const gameEntity =
          await this.gameService.getUserGameWithSubscriptions(gameId);

        if (!gameEntity) {
          return this.telegramService.notifyUserAboutError(
            context,
            "Игра не найдена.",
          );
        }

        context.session.selectedGame = gameEntity;

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

        await this.telegramService.deleteLastMessage(
          context,
          "gameNewsMessagesId",
        );

        context.session.filteredNews = filteredNews.appnews.newsitems;

        const markup = buildNewsPaginationMarkUp(
          filteredNews.appnews.newsitems,
          0,
          "news_check",
        );

        await this.telegramService.sendAndTrackMessage(
          context,
          "📰 *Выберите новость:*",
          "gameNewsMessagesId",
          markup,
        );
      },
    );

    this.bot.action(
      /^news_check_news_toggle_page:(\d+)$/,
      async (context: IBotContext) => {
        const page = Number(context.match?.[1]);

        await context.editMessageReplyMarkup(
          buildNewsPaginationMarkUp(
            context.session.filteredNews!,
            page,
            "news_check",
          ).reply_markup,
        );

        await context.answerCbQuery();
      },
    );

    this.bot.action(
      /^news_check_news_select:(\d+)$/,
      async (context: IBotContext) => {
        const gid = String(context.match?.[1]);

        const news = context.session.filteredNews?.find(
          (news) => news.gid === gid,
        );

        if (!news)
          return this.telegramService.notifyUserAboutError(
            context,
            "Произошла ошибка с поиском новостей.",
          );

        await this.telegramService.deleteLastMessage(
          context,
          "gameNewsMessagesId",
        );

        await this.telegramService.sendAndTrackMessage(
          context,
          createNewsMessage(news, context.session.selectedGame!.name),
          "gameNewsMessagesId",
          Markup.inlineKeyboard([
            Markup.button.callback("Назад", "news_check_return_pagination"),
          ]),
        );
      },
    );

    this.bot.action(
      "news_check_return_pagination",
      async (context: IBotContext) => {
        const markup = buildNewsPaginationMarkUp(
          context.session.filteredNews!,
          0,
          "news_check",
        );

        await this.telegramService.deleteLastMessage(
          context,
          "gameNewsMessagesId",
        );

        await this.telegramService.sendAndTrackMessage(
          context,
          "📰 *Выберите игру:*",
          "gameNewsMessagesId",
          markup,
        );
      },
    );
  }

  private async saveNewsToDB(news: GameNewsInfo, game: Game): Promise<void> {
    const newsItems = news.appnews.newsitems;

    for (const item of newsItems) {
      await this.newsService.saveNewsGame(item.title, item.gid, game);
    }
  }
}

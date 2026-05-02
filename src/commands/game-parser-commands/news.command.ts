import { Markup, Telegraf } from "telegraf";

import {
  GameService,
  NewsService,
  SteamService,
  UserService,
} from "../../services";
import {
  compareNewNews,
  createNewsMessage,
  filterRelevantNews,
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
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("check_news", async (context: IBotContext) => {
      if (!context.from?.id) throw new Error("Не определен пользователь");

      const user = await this.userService.getUserWithGames(context.from.id);

      const games = user?.games;

      if (!games || games.length === 0)
        return notifyUserAboutError(
          context,
          "В списке отслеживаемого ничего не найдено.",
        );

      await this.displayGames(context, games);
    });

    this.bot.action("check__game_news", async (context) => {
      const selectedGameName: string =
        context.callbackQuery?.message &&
        "text" in context.callbackQuery.message
          ? context.callbackQuery.message.text
          : "";

      if (!selectedGameName)
        return notifyUserAboutError(context, "Ошибка при выборе игры.");

      const selectedGame = await this.gameService.getUserGame(selectedGameName);

      if (!selectedGame) {
        console.log("Игра не найдена:", selectedGame);
        return notifyUserAboutError(context, "Игра не найдена.");
      }

      const news = await this.steamService.fetchGameNews(selectedGame.steamId);

      if (!news)
        return notifyUserAboutError(
          context,
          "Не удалось получить ни одной новости.",
        );

      const filteredNews = filterRelevantNews(news);

      const newNews = await compareNewNews(filteredNews, selectedGame.steamId);

      if (!news) return notifyUserAboutError(context, "Новости не найдены.");

      await this.saveNewsToDB(newNews, selectedGame);

      await this.sendNewsToUser(context, news, selectedGame.name);
    });
  }

  private async displayGames(
    context: IBotContext,
    games: Game[],
  ): Promise<void> {
    for (const game of games) {
      const message = await context.sendMessage(
        game.name,
        Markup.inlineKeyboard([
          Markup.button.callback("Узнать новость", "check__game_news"),
        ]),
      );

      context.session.messagesId.gameNewsMessagesId.push(message.message_id);
    }
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

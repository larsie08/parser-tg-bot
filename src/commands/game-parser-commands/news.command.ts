import { Markup, Telegraf } from "telegraf";
import axios from "axios";

import { GameService, NewsService, UserService } from "../../services";
import {
  createNewsMessage,
  filterRelevantNews,
  notifyUserAboutError,
} from "../../utils";

import { Command, GameNewsInfo, IBotContext } from "../../context";
import { Game } from "../../entities";

export class GameNewsCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("check_news", async (context: IBotContext) => {
      if (!context.from?.id) throw new Error("Не определен пользователь");

      const user = await new UserService().getUserWithGames(context.from.id);

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

      const selectedGame = await new GameService().getUserGame(
        selectedGameName,
      );

      if (!selectedGame) {
        console.log("Игра не найдена:", selectedGame);
        return notifyUserAboutError(context, "Игра не найдена.");
      }

      const news = await this.fetchGameNews(selectedGame.steamId);

      if (!news)
        return notifyUserAboutError(
          context,
          "Не удалось получить ни одной новости.",
        );

      const filteredNews = filterRelevantNews(news);

      const newNews = await this.compareNewNews(
        filteredNews,
        selectedGame.steamId,
      );

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

  async fetchGameNews(gameId: string): Promise<GameNewsInfo | null> {
    try {
      const { data } = await axios.get(
        `http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${gameId}&count=3&maxlength=300&format=json`,
      );
      return data;
    } catch (error) {
      console.error("Ошибка при запросе новостей Steam:", error);
      return null;
    }
  }

  async compareNewNews(
    news: GameNewsInfo,
    gameSteamId: string,
  ): Promise<GameNewsInfo> {
    const ids = news.appnews.newsitems.map((item) => item.gid);

    const existingNews = await new NewsService().getNewsGame(ids, gameSteamId);

    const existingIds = new Set(existingNews.map((item) => item.newsId));

    const newNewsItems = news.appnews.newsitems.filter(
      (item) => !existingIds.has(item.gid),
    );

    return {
      appnews: {
        ...news.appnews,
        newsitems: newNewsItems,
      },
    };
  }

  async saveNewsToDB(news: GameNewsInfo, game: Game): Promise<void> {
    const newsItems = news.appnews.newsitems;

    for (const item of newsItems) {
      await new NewsService().saveNewsGame(item.title, item.gid, game);
    }
  }

  private async sendNewsToUser(
    context: IBotContext,
    news: GameNewsInfo,
    gameName: string,
  ): Promise<void> {
    for (const item of news.appnews.newsitems) {
      const message = createNewsMessage(item, gameName, news.appnews.newsitems);
      await context.sendMessage(message).then((message) => message.message_id);
    }
  }
}

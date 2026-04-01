import { Markup, Telegraf } from "telegraf";
import axios from "axios";

import { Command } from "../command.class";

import { GameService, NewsService, UserService } from "../../services";

import { GameNewsInfo, IBotContext, NewsItem } from "../../context";
import { Game, News } from "../../entities";
import { AppDataSource } from "../../config";

export class GameNewsCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("check_news", async (context: IBotContext) => {
      const messagesId: number[] = [];

      if (!context.from?.id) throw new Error("Не определен пользователь");

      const user = await new UserService().getUserWithGames(context.from.id);

      const games = user?.games;

      if (!games || games.length === 0) {
        return context.sendMessage(
          "В списке отслеживаемого ничего не найдено.",
        );
      }

      messagesId.push(...(await this.displayGames(context, games)));
    });

    this.bot.action("check__game_news", async (context) => {
      const selectedGameName = (context.callbackQuery.message as any).text;

      if (!selectedGameName) {
        return context.sendMessage("Ошибка при выборе игры.");
      }

      const selectedGame = await new GameService().getUserGame(
        selectedGameName,
      );

      if (!selectedGame) {
        console.log("Игра не найдена.", selectedGame);
        return context.sendMessage("Игра не найдена.");
      }

      const news = await this.fetchGameNews(selectedGame.steamId);

      if (!news)
        return context.sendMessage("Не удалось получить ни одной новости.");

      const newNews = await this.compareNewNews(news, selectedGame.steamId);

      if (!news) {
        return context.sendMessage("Новости не найдены.");
      }

      await this.saveNewsToDB(newNews, selectedGame);

      await this.sendNewsToUser(news, context.from?.id);
    });
  }

  private async displayGames(
    context: IBotContext,
    games: Game[],
  ): Promise<number[]> {
    const messageIds: number[] = [];
    for (const game of games) {
      const message = await context.sendMessage(
        game.name,
        Markup.inlineKeyboard([
          Markup.button.callback("Узнать новость", "check__game_news"),
        ]),
      );
      messageIds.push(message.message_id);
    }
    return messageIds;
  }

  async fetchGameNews(gameId: string): Promise<GameNewsInfo | null> {
    try {
      const { data } = await axios.get(
        `http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${gameId}&count=2&maxlength=300&format=json`,
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

  async sendNewsToUser(news: GameNewsInfo, userId: number): Promise<void> {
    for (const item of news.appnews.newsitems) {
      const message = this.createNewsMessage(item, news.appnews.newsitems);
      await this.bot.telegram.sendMessage(userId, message);
    }
  }

  private createNewsMessage(currentNews: NewsItem, news?: NewsItem[]): string {
    let message: string = `Новость: ${currentNews.title}\nТекст: ${currentNews.contents}\nСсылка: ${currentNews.url}`;

    if (news && !news.some((item) => item.gid === currentNews.gid)) {
      message = `Новая новость!\nНовость: ${currentNews.title}\nТекст: ${currentNews.contents}\nСсылка: ${currentNews.url}`;
    }

    return message;
  }
}

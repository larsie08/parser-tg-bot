import { Markup, Telegraf } from "telegraf";
import axios from "axios";

import { ParserCommand } from "./parser.command";
import { Command } from "../command.class";

import { IBotContext } from "../../context/context.interface";
import { GameNewsInfo, NewsItem } from "./game.interface";

export class GameNewsCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("check_news", async (context) => {
      const messagesId: number[] = [];
      const userId = context.from?.id;

      if (!userId) {
        await context.sendMessage("Пользователь не найден.");
        return;
      }

      const parserCommand = new ParserCommand(this.bot);

      const games = await parserCommand.handleUserGames(userId);

      if (!games || games.length === 0) {
        return context.sendMessage(
          "В списке отслеживаемого ничего не найдено."
        );
      }

      messagesId.push(...(await this.displayGames(context, games)));

      this.bot.action("check__game_news", async (context) => {
        const selectedGameName = (context.callbackQuery.message as any).text;

        if (!selectedGameName) {
          return context.sendMessage("Ошибка при выборе игры.");
        }

        const selectedGame = games.find(
          (game) => game.name === selectedGameName
        );

        if (!selectedGame) {
          return context.sendMessage("Игра не найдена.");
        }

        const news = await this.fetchGameNews(selectedGame.steamId);

        if (!news) {
          return context.sendMessage("Новости не найдены.");
        }

        this.sendNewsToUser(news, userId);
      });
    });
  }

  private async displayGames(
    context: IBotContext,
    games: any[]
  ): Promise<number[]> {
    const messageIds: number[] = [];
    for (const game of games) {
      const message = await context.sendMessage(
        game.name,
        Markup.inlineKeyboard([
          Markup.button.callback("Узнать новость", "check__game_news"),
        ])
      );
      messageIds.push(message.message_id);
    }
    return messageIds;
  }

  async fetchGameNews(gameId: string): Promise<GameNewsInfo | null> {
    try {
      const { data } = await axios.get(
        `http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${gameId}&count=2&maxlength=300&format=json`
      );
      return data;
    } catch (error) {
      console.error("Ошибка при запросе новостей Steam:", error);
      return null;
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

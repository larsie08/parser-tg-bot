import { Telegraf } from "telegraf";

import { Command } from "../command.class";
import { ParserCommand } from "./parser.command";
import { GameNewsCommand } from "./news.command";

import { AppDataSource } from "../../config";
import { IBotContext } from "../../context/context.interface";

import { Game, User } from "../../entities";
import {
  IGameMarketData,
  IGameMarketInfo,
  IGameSteamData,
  IGameSteamInfo,
  NewsItem,
} from "./game.interface";

export class AutoParserCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  async handle(): Promise<void> {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();

    this.startAutoParser(users);
  }

  private async startAutoParser(users: User[]): Promise<void> {
    const parserClass = new ParserCommand(this.bot);
    const newsClass = new GameNewsCommand(this.bot);

    const steamGames: Map<string, IGameSteamInfo> = new Map();
    const marketGames: Map<string, IGameMarketInfo[]> = new Map();
    const newsMap: Map<number, NewsItem[]> = new Map();

    await Promise.all(
      users.map((user) =>
        this.processUserGames(
          user,
          parserClass,
          newsClass,
          steamGames,
          marketGames,
          newsMap,
          false
        )
      )
    );

    users.forEach((user) =>
      this.setupPeriodicParsing(
        user,
        parserClass,
        newsClass,
        steamGames,
        marketGames,
        newsMap
      )
    );
  }

  private async processUserGames(
    user: User,
    parserClass: ParserCommand,
    newsClass: GameNewsCommand,
    steamGames: Map<string, IGameSteamInfo>,
    marketGames: Map<string, IGameMarketInfo[]>,
    newsMap: Map<number, NewsItem[]>,
    notify: boolean
  ): Promise<void> {
    try {
      const games = await parserClass.handleUserGames(user.userId);
      if (games && games.length > 0) {
        await this.autoParser(
          parserClass,
          newsClass,
          games,
          user,
          steamGames,
          marketGames,
          newsMap,
          notify
        );
      } else {
        console.log(`Нет игр для отслеживания у пользователя ${user.userId}.`);
      }
    } catch (error) {
      console.error(
        `Ошибка обработки игр для пользователя ${user.userId}:`,
        error
      );
    }
  }

  private setupPeriodicParsing(
    user: User,
    parserClass: ParserCommand,
    newsClass: GameNewsCommand,
    steamGames: Map<string, IGameSteamInfo>,
    marketGames: Map<string, IGameMarketInfo[]>,
    newsMap: Map<number, NewsItem[]>
  ): void {
    setInterval(async () => {
      await this.processUserGames(
        user,
        parserClass,
        newsClass,
        steamGames,
        marketGames,
        newsMap,
        true
      );
    }, 60 * 60 * 1000);
  }

  private async autoParser(
    parserClass: ParserCommand,
    newsClass: GameNewsCommand,
    games: Game[],
    user: User,
    steamGames: Map<string, IGameSteamInfo>,
    marketGames: Map<string, IGameMarketInfo[]>,
    newsMap: Map<number, NewsItem[]>,
    notify: boolean
  ): Promise<void> {
    for (const game of games) {
      const url = parserClass.handleFormatUrlSearch(game.name);
      const steamGameData = await parserClass.fetchGameInfoSteam(url);
      const marketGamesData = await parserClass.fetchGameInfoPlatiMarket(url);

      if (!steamGameData || !marketGamesData || marketGamesData.length === 0) {
        console.log(`Не удалось получить данные для игры: ${game.name}`);
        continue;
      }

      this.processSteamGame(steamGameData, user, steamGames, notify);
      this.processMarketGames(
        marketGamesData,
        user,
        marketGames,
        game.name,
        notify
      );
      this.processGameNews(newsMap, user, game, newsClass, notify);
    }
  }

  private async processSteamGame(
    steamGameData: IGameSteamData,
    user: User,
    steamGames: Map<string, IGameSteamInfo>,
    notify: boolean
  ): Promise<void> {
    const currentSteamGame = steamGames.get(steamGameData.name);

    const isPriceChanged =
      currentSteamGame && currentSteamGame.price !== steamGameData.price;

    steamGames.set(steamGameData.name, {
      userId: user.userId,
      ...steamGameData,
    });

    if (notify && (isPriceChanged || !currentSteamGame)) {
      const message = this.createGameMessage(steamGameData, isPriceChanged);
      await this.bot.telegram.sendMessage(user.userId, message);
    }
  }

  private async processMarketGames(
    marketGamesData: IGameMarketData[],
    user: User,
    marketGames: Map<string, IGameMarketInfo[]>,
    gameName: string,
    notify: boolean
  ): Promise<void> {
    const currentMarketGames = marketGames.get(gameName) || [];

    for (const gameData of marketGamesData) {
      if (
        notify &&
        !currentMarketGames.some((game) => game.name === gameData.name)
      ) {
        const message = this.createGameMessage(gameData, true);
        await this.bot.telegram.sendMessage(
          user.userId,
          `Появилось новое предложение!\n${message}`
        );
      }
    }

    marketGames.set(
      gameName,
      marketGamesData.map((game) => ({ userId: user.userId, ...game }))
    );
  }

  private async processGameNews(
    newsMap: Map<number, NewsItem[]>,
    user: User,
    game: Game,
    newsClass: GameNewsCommand,
    notify: boolean
  ) {
    const newsData = await newsClass.fetchGameNews(game.steamId);

    if (!newsData) {
      return;
    }

    const previousNews = newsMap.get(game.id) || [];
    const newNews = newsData.appnews.newsitems.filter(
      (newsItem) => !previousNews.some((prev) => prev.gid === newsItem.gid)
    );

    if (newNews.length) {
      newsMap.set(game.id, newsData.appnews.newsitems);

      if (notify) {
        await newsClass.sendNewsToUser(
          { appnews: { appid: +game.steamId, newsitems: newNews } },
          user.userId
        );
      }
    }
  }

  private createGameMessage(
    gameData: IGameSteamData | IGameMarketData,
    isChanged?: boolean
  ): string {
    let messageText: string;

    if ("sales" in gameData && gameData.sales) {
      messageText = `Название: ${gameData.name}\nЦена: ${gameData.price}\nПродаж: ${gameData.sales}\nСсылка: ${gameData.href}`;
    } else {
      messageText = `Название: ${gameData.name}\nЦена: ${gameData.price}\nСсылка: ${gameData.href}`;

      if ("discount" in gameData && gameData.oldPrice && gameData.discount) {
        messageText = `Название: ${gameData.name}\nСтарая цена: ${gameData.oldPrice}\nЦена: ${gameData.price}\nСкидка: ${gameData.discount}\nСсылка: ${gameData.href}`;
      }
    }

    if (isChanged) {
      messageText = `Изменение цены на игру!\n${messageText}`;
    }

    return messageText;
  }
}

import { Telegraf } from "telegraf";

import { Command } from "../command.class";
import { ParserCommand } from "./parser.command";
import { GameNewsCommand } from "./news.command";

import { AppDataSource } from "../../config";
import { IBotContext } from "../../context/context.interface";

import { Game, User } from "../../entities";
import { IGameSteamData, IGameSteamInfo, NewsItem } from "./game.interface";

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
    const newsMap: Map<number, NewsItem[]> = new Map();

    await Promise.all(
      users.map((user) =>
        this.processUserGames(
          user,
          parserClass,
          newsClass,
          steamGames,
          newsMap,
          false,
        ),
      ),
    );

    users.forEach((user) =>
      this.setupPeriodicParsing(
        user,
        parserClass,
        newsClass,
        steamGames,
        newsMap,
      ),
    );
  }

  private async processUserGames(
    user: User,
    parserClass: ParserCommand,
    newsClass: GameNewsCommand,
    steamGames: Map<string, IGameSteamInfo>,
    newsMap: Map<number, NewsItem[]>,
    notify: boolean,
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
          newsMap,
          notify,
        );
      } else {
        console.log(`Нет игр для отслеживания у пользователя ${user.userId}.`);
      }
    } catch (error) {
      console.error(
        `Ошибка обработки игр для пользователя ${user.userId}:`,
        error,
      );
    }
  }

  private setupPeriodicParsing(
    user: User,
    parserClass: ParserCommand,
    newsClass: GameNewsCommand,
    steamGames: Map<string, IGameSteamInfo>,
    newsMap: Map<number, NewsItem[]>,
  ): void {
    setInterval(
      async () => {
        await this.processUserGames(
          user,
          parserClass,
          newsClass,
          steamGames,
          newsMap,
          true,
        );
      },
      60 * 120 * 1000,
    );
  }

  private async autoParser(
    parserClass: ParserCommand,
    newsClass: GameNewsCommand,
    games: Game[],
    user: User,
    steamGames: Map<string, IGameSteamInfo>,
    newsMap: Map<number, NewsItem[]>,
    notify: boolean,
  ): Promise<void> {
    for (const game of games) {
      try {
        // const url = parserClass.handleFormatUrlSearch(game.name);
        const gameEntity = await AppDataSource.getRepository(Game).findOne({
          where: { name: game.name },
        });
        const gameId = gameEntity?.steamId || "";

        const steamGameData = await parserClass.fetchGameInfoSteam(gameId);
        this.handleSteamData(
          steamGameData,
          game,
          user,
          steamGames,
          notify,
          parserClass,
          newsClass,
          newsMap,
        );
      } catch (error) {
        console.error(`Ошибка при обработке игры ${game.name}:`, error);
      }
    }
  }

  private handleSteamData(
    steamGameData: IGameSteamData | null,
    game: Game,
    user: User,
    steamGames: Map<string, IGameSteamInfo>,
    notify: boolean,
    parserClass: ParserCommand,
    newsClass: GameNewsCommand,
    newsMap: Map<number, NewsItem[]>,
  ): void {
    if (!steamGameData) {
      console.log(`❌ Не удалось получить данные для ${game.name} на Steam`);
      return;
    }
    this.processSteamGame(steamGameData, user, steamGames, notify, parserClass);
    this.processGameNews(newsMap, user, game, newsClass, notify);
  }

  private async processSteamGame(
    steamGameData: IGameSteamData,
    user: User,
    steamGames: Map<string, IGameSteamInfo>,
    notify: boolean,
    parserClass: ParserCommand,
  ): Promise<void> {
    const currentSteamGame = steamGames.get(steamGameData.name);

    const changesDetected = {
      priceChanged: currentSteamGame?.price !== steamGameData.price,
      releaseDateChanged:
        currentSteamGame?.releaseDate !== steamGameData.releaseDate,
      releaseTimeChanged:
        currentSteamGame?.releaseTime !== steamGameData.releaseTime,
    };

    steamGames.set(steamGameData.name, {
      userId: user.userId,
      ...steamGameData,
    });

    if (
      notify &&
      (changesDetected.priceChanged ||
        changesDetected.releaseDateChanged ||
        changesDetected.releaseTimeChanged ||
        !currentSteamGame)
    ) {
      const message = parserClass.createGameMessage(
        steamGameData,
        changesDetected.priceChanged,
        changesDetected.releaseDateChanged,
        changesDetected.releaseTimeChanged,
      );
      await this.bot.telegram.sendMessage(user.userId, message);
    }
  }

  private async processGameNews(
    newsMap: Map<number, NewsItem[]>,
    user: User,
    game: Game,
    newsClass: GameNewsCommand,
    notify: boolean,
  ) {
    const newsData = await newsClass.fetchGameNews(game.steamId);

    if (!newsData) {
      return console.log(`Не удалось получить новости для игры: ${game.name}`);
    }

    const previousNews = newsMap.get(game.id) || [];
    const newNews = newsData.appnews.newsitems.filter(
      (newsItem) => !previousNews.some((prev) => prev.gid === newsItem.gid),
    );

    if (newNews.length) {
      newsMap.set(game.id, newsData.appnews.newsitems);

      if (notify) {
        await newsClass.sendNewsToUser(
          { appnews: { appid: +game.steamId, newsitems: newNews } },
          user.userId,
        );
      }
    }
  }
}

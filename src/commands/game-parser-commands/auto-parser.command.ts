import { Telegraf } from "telegraf";

import { ParserCommand } from "./parser.command";
import { GameNewsCommand } from "./news.command";

import { GameMetaService, UserService } from "../../services";

import { Game, User } from "../../entities";
import { Command, IBotContext, IGameSteamData } from "../../context";

export class AutoParserCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  async handle(): Promise<void> {
    setInterval(
      async () => {
        const users = await new UserService().getAllUsersWithGames();

        if (!users) throw new Error("Не найдено ни одного пользователя.");

        for (const user of users) await this.processUserGames(user);
      },
      60 * 120 * 1000,
    );
  }

  private async processUserGames(user: User): Promise<void> {
    try {
      if (user.games.length === 0)
        return console.log(
          `Нет игр для отслеживания у пользователя ${user.userId}.`,
        );

      await this.autoParser(user);
    } catch (error) {
      throw new Error(`Ошибка обработки игр для пользователя ${user.userId}:`);
    }
  }

  private async autoParser(user: User): Promise<void> {
    const parserClass = new ParserCommand(this.bot);
    const newsClass = new GameNewsCommand(this.bot);

    for (const game of user.games) {
      try {
        const steamGameData = await parserClass.fetchGameInfoSteam(
          game.steamId,
        );

        if (!steamGameData)
          throw new Error(`Ошибка при обработке игры ${game.name}:`);

        this.processSteamGame(steamGameData, user.userId, game, parserClass);
        this.processGameNews(user.userId, game, newsClass);
      } catch (error) {
        throw new Error(`Ошибка при обработке игры ${game.name}:`);
      }
    }
  }

  private async processSteamGame(
    steamGameData: IGameSteamData,
    userID: number,
    game: Game,
    parserClass: ParserCommand,
  ): Promise<void> {
    const changesDetected = await this.getDiffData(game, steamGameData);
    const hasAnyChange = Object.values(changesDetected).length;

    if (game.meta || hasAnyChange === 0) return;

    await new GameMetaService().upsertMetaInfo(steamGameData, game);

    const message = parserClass.createGameMessage(
      steamGameData,
      changesDetected,
    );

    await this.bot.telegram.sendMessage(userID, message);
  }

  private async getDiffData(
    game: Game,
    steamGameData: IGameSteamData,
  ): Promise<Partial<IGameSteamData>> {
    const changes: Partial<IGameSteamData> = {};
    const meta: Partial<IGameSteamData> =
      (await new GameMetaService().getMetaInfo(game)) ?? {};

    for (const key of Object.keys(steamGameData) as (keyof IGameSteamData)[]) {
      if (key === "name" || key === "href") continue;

      const newValue = steamGameData[key] ?? undefined;
      const metaNewValue = meta[key] ?? undefined;

      if (
        (key === "releaseDate" && metaNewValue !== newValue) ||
        (key === "releaseTime" && metaNewValue !== newValue)
      ) {
        changes[key] = newValue;
        continue;
      }

      if (metaNewValue !== newValue) {
        changes[key] = newValue;
      }
    }

    return changes;
  }

  private async processGameNews(
    userId: number,
    game: Game,
    newsClass: GameNewsCommand,
  ): Promise<void> {
    const newsData = await newsClass.fetchGameNews(game.steamId);

    if (!newsData) {
      return console.log(`Не удалось получить новости для игры: ${game.name}`);
    }

    const existedNews = await newsClass.compareNewNews(newsData, game.steamId);

    await newsClass.saveNewsToDB(existedNews, game);

    if (existedNews.appnews.newsitems.length > 0) {
      await newsClass.sendNewsToUser(existedNews, userId);
    }
  }
}

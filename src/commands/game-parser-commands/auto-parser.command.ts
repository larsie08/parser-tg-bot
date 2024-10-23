import { Telegraf } from "telegraf";

import { Command } from "../command.class";
import { ParserCommand } from "./parser.command";

import { AppDataSource } from "../../config";
import { IBotContext } from "../../context/context.interface";

import { Game, User } from "../../entities";
import {
  IGameMarketData,
  IGameMarketInfo,
  IGameSteamData,
  IGameSteamInfo,
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

  private async startAutoParser(users: User[]) {
    const parserClass = new ParserCommand(this.bot);
    const steamGames: Map<string, IGameSteamInfo> = new Map();
    const marketGames: Map<string, IGameMarketInfo[]> = new Map();

    for (const user of users) {
      setInterval(async () => {
        try {
          const games = await parserClass.handleUserGames(user.userId);

          if (!games || games.length === 0) {
            return console.log("Нет игр для отслеживания.");
          }

          this.autoParser(parserClass, games, user, steamGames, marketGames);
        } catch (error) {
          console.error("Ошибка при автоматическом парсинге:", error);
        }
      }, 60 * 60 * 1000);
    }
  }

  private async autoParser(
    parserClass: ParserCommand,
    games: Game[],
    user: User,
    steamGames: Map<string, IGameSteamInfo>,
    marketGames: Map<string, IGameMarketInfo[]>
  ) {
    for (const game of games) {
      const url = parserClass.handleFormatUrlSearch(game.name);
      const steamGameData = await parserClass.fetchGameInfoSteam(url);
      const marketGamesData = await parserClass.fetchGameInfoPlatiMarket(url);

      if (!steamGameData || !marketGamesData || marketGamesData.length === 0) {
        console.log(`Не удалось получить данные для игры: ${game.name}`);
        continue;
      }

      this.processSteamGame(steamGameData, user, steamGames);
      this.processMarketGames(marketGamesData, user, marketGames, game.name);
    }
  }

  private processSteamGame(
    steamGameData: IGameSteamData,
    user: User,
    steamGames: Map<string, IGameSteamInfo>
  ) {
    const currentSteamGame = steamGames.get(steamGameData.name);

    if (!currentSteamGame) {
      steamGames.set(steamGameData.name, {
        userId: user.userId,
        ...steamGameData,
      });
      const message = this.createGameMessage(steamGameData);
      this.bot.telegram.sendMessage(user.userId, message);
    } else if (currentSteamGame.price !== steamGameData.price) {
      steamGames.set(steamGameData.name, {
        userId: user.userId,
        ...steamGameData,
      });
      const message = this.createGameMessage(steamGameData, true);
      this.bot.telegram.sendMessage(user.userId, message);
    }
  }

  private async processMarketGames(
    marketGamesData: IGameMarketData[],
    user: User,
    marketGames: Map<string, IGameMarketInfo[]>,
    gameName: string
  ) {
    const currentMarketGames = marketGames.get(gameName) || [];

    for (const gameData of marketGamesData) {
      const currentGame = currentMarketGames.find(
        (game) => game.name === gameData.name
      );

      if (!currentGame) {
        const message = this.createGameMessage(gameData);
        await this.bot.telegram.sendMessage(user.userId, message);
      } else {
        const message = this.createGameMessage(gameData);
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

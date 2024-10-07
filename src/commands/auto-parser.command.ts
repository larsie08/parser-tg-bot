import { Telegraf } from "telegraf";

import { Command } from "./command.class";
import { IGameData, ParserCommand } from "./parser.command";

import { AppDataSource } from "../config";
import { IBotContext } from "../context/context.interface";

import { Game, User } from "../entities";

interface IGamesInfo extends IGameData {
  userId: number;
}

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
    const prevGames: IGamesInfo[] = [];

    for (const user of users) {
      setInterval(async () => {
        try {
          const games = await parserClass.handleUserGames(user.userId);

          if (!games || games.length === 0) {
            return console.log("Нет игр для отслеживания.");
          }

          this.autoParser(parserClass, games, user, prevGames);
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
    prevGames: IGamesInfo[]
  ) {
    for (const game of games) {
      const url = parserClass.handleFormatUrlSearch(game.name);
      const gameData = await parserClass.fetchGameInfoSteam(url);

      if (!gameData)
        return console.log(`Не удалось получить данные для игры: ${game.name}`);

      const currentGame = prevGames.find(
        (gameInfo) => gameData.name === gameInfo.name
      );

      if (!currentGame) {
        prevGames.push({ userId: user.userId, ...gameData });
        const message = this.createGameMessage(gameData);
        await this.bot.telegram.sendMessage(user.userId, message);
      } else {
        if (currentGame.price !== gameData.price) {
          this.updateGameInfo(prevGames, gameData);
          const message = this.createGameMessage(gameData, true);
          await this.bot.telegram.sendMessage(user.userId, message);
        }
      }
    }
  }

  private updateGameInfo(prevGames: IGamesInfo[], gameData: IGameData) {
    const index = prevGames.findIndex(
      (gameInfo) => gameInfo.name === gameData.name
    );
    if (index !== -1) {
      Object.assign(prevGames[index], gameData);
    }
  }

  private createGameMessage(gameData: IGameData, isChanged?: boolean): string {
    let messageText = `Название: ${gameData.name}\nЦена: ${gameData.price}\nСсылка: ${gameData.href}`;

    if (gameData.oldPrice || gameData.discount) {
      messageText = `Название: ${gameData.name}\nСтарая цена: ${gameData.oldPrice}\nЦена: ${gameData.price}\nСкидка: ${gameData.discount}\nСсылка: ${gameData.href}`;
    }

    if (isChanged) {
      messageText = `Изменение цены на игру!\n${messageText}`;
    }

    return messageText;
  }
}

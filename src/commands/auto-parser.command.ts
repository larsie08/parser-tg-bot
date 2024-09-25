import { Telegraf } from "telegraf";

import { Command } from "./command.class";
import { ParserCommand } from "./parser.command";

import { AppDataSource } from "../config";
import { IBotContext } from "../context/context.interface";

import { Game, User } from "../entities";

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

    for (const user of users) {
      setInterval(async () => {
        try {
          console.log("Запуск автоматического парсинга...");
          const games = await parserClass.handleUserGames(user.userId);

          if (!games || games.length === 0) {
            return console.log("Нет игр для отслеживания.");
          }

          this.autoParser(parserClass, games, user);
        } catch (error) {
          console.error("Ошибка при автоматическом парсинге:", error);
        }
      }, 60 * 60 * 1000);
    }
  }

  private async autoParser(
    parserClass: ParserCommand,
    games: Game[],
    user: User
  ) {
    for (const game of games) {
      const url = parserClass.handleFormatUrlSearch(game.name);
      const gameData = await parserClass.fetchGameInfoSteam(url);

      if (!gameData) {
        return console.log(`Не удалось получить данные для игры: ${game.name}`);
      }

      let messageText = `Название: ${gameData.name}\nЦена: ${gameData.price}\nСсылка: ${gameData.href}`;

      if (gameData.oldPrice || gameData.discount) {
        messageText = `Название: ${gameData.name}\nСтарая цена: ${gameData.oldPrice}\nЦена: ${gameData.price}\nСкидка: ${gameData.discount}\nСсылка: ${gameData.href}`;
      }

      this.bot.telegram.sendMessage(user.userId, messageText);
    }
  }
}

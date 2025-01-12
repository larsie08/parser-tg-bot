import { Markup, Telegraf } from "telegraf";

import { Command } from "./command.class";

import { IBotContext } from "../context/context.interface";
import { AppDataSource } from "../config/typeOrm.config";
import { User } from "../entities";
import { AutoParserCommand } from "./game-parser-commands/auto-parser.command";

export class StartCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.start(async (context) => {
      const user = await this.handleUser(context);
      const userName = user?.userName || context.from?.first_name;

      context.reply(
        `Привет! ${userName}, чем могу помочь?`,
        Markup.keyboard([["Меню парсера", "Управление играми"]]).oneTime()
      );

      this.setupMenuHandlers();
    });
  }

  private setupMenuHandlers(): void {
    this.bot.hears("Меню парсера", (ctx) => {
      ctx.reply(
        "Выберите команду",
        Markup.inlineKeyboard([
          Markup.button.callback("Проверить цену игры", "check_price"),
          Markup.button.callback("Узнать последние новости игры", "check_news"),
        ])
      );
    });

    this.bot.hears("Управление играми", (ctx) => {
      ctx.reply(
        "Выберите команду",
        Markup.inlineKeyboard([
          Markup.button.callback(
            "Добавить игру в список отслеживания",
            "game_add"
          ),
          Markup.button.callback(
            "Удалить игру из списка отслеживания",
            "game_delete"
          ),
        ])
      );
    });
  }

  private async handleUser(context: IBotContext): Promise<User | null> {
    const contextUserId = context.from?.id;
    const contextUserName = context.from?.first_name;

    if (!contextUserId || !contextUserName) {
      console.log(
        "Ошибка инициализации пользователя",
        contextUserId,
        contextUserName
      );
      return null;
    }

    const userRepository = AppDataSource.getRepository(User);

    const currentUser = await userRepository.findOne({
      where: { userId: contextUserId },
    });

    if (!currentUser) {
      console.log("Пользователь не найден, добавляем в базу...");
      const user = new User();
      user.userId = contextUserId;
      user.userName = contextUserName;

      try {
        await userRepository.save(user);
        console.log("Пользователь успешно сохранён в базу данных!");
      } catch (error) {
        console.error("Ошибка сохранения пользователя:", error);
      }
    } else {
      console.log("Пользователь уже существует:", currentUser);
    }

    return currentUser;
  }
}

import { Markup, Telegraf } from "telegraf";

import { Command } from "./command.class";

import { AppDataSource } from "../config/typeOrm.config";
import { UserService } from "../services/user.service";
import { User } from "../entities";
import { IBotContext } from "../context";

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
        Markup.keyboard([["Меню парсера", "Управление играми"]]).oneTime(),
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
        ]),
      );
    });

    this.bot.hears("Управление играми", (ctx) => {
      ctx.reply(
        "Выберите команду",
        Markup.inlineKeyboard([
          Markup.button.callback(
            "Добавить игру в список отслеживания",
            "game_add",
          ),
          Markup.button.callback(
            "Удалить игру из списка отслеживания",
            "game_delete",
          ),
        ]),
      );
    });
  }

  private async handleUser(context: IBotContext): Promise<User> {
    if (!context.from)
      throw new Error("Не удалось определить пользователя при добавлении.");

    const currentUser = await new UserService().getUser(context.from?.id);

    if (!currentUser) {
      console.log("Пользователь не найден, добавляем в базу...");

      try {
        const user = await new UserService().saveUser(
          context.from?.id,
          context.from?.first_name,
        );

        console.log("Пользователь успешно сохранён в базу данных!");

        return user;
      } catch (error) {
        throw new Error("Ошибка сохранения пользователя:");
      }
    }

    console.log("Пользователь уже существует:", currentUser);

    return currentUser;
  }
}

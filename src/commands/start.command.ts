import { Telegraf, Markup } from "telegraf";

import { UserService } from "../services";

import { User } from "../entities";
import { Command, IBotContext } from "../context";
import {
  cancelOperationMessage,
  sendAndTrackMessage,
  trackUserMessage,
} from "../utils";

export class StartCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private userService: UserService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.start(async (context: IBotContext) => {
      const user = await this.handleUser(context);
      const userName = user?.userName || context.from?.first_name;

      await context.sendMessage(
        `Привет! ${userName}, чем могу помочь?`,
        Markup.keyboard([
          ["Меню парсера", "Управление играми", "Управление уведомлениями"],
        ]).oneTime(),
      );

      this.setupMenuHandlers();
    });

    this.bot.action("start_command_cancel", async (context: IBotContext) => {
      await cancelOperationMessage(
        context,
        "gameMenuCommandMessageId",
        null,
        "Отменено.",
      );
    });
  }

  private setupMenuHandlers(): void {
    this.bot.hears("Меню парсера", async (context: IBotContext) => {
      trackUserMessage(context, "gameMenuCommandMessageId");

      await sendAndTrackMessage(
        context,
        "Выберите команду",
        "gameMenuCommandMessageId",
        Markup.inlineKeyboard([
          [
            Markup.button.callback("Проверить цену игры", "price_check_start"),
            Markup.button.callback(
              "Узнать последние новости игры",
              "news_check_start",
            ),
          ],
          [Markup.button.callback("Отменить", "start_command_cancel")],
        ]),
      );
    });

    this.bot.hears("Управление играми", async (context: IBotContext) => {
      trackUserMessage(context, "gameMenuCommandMessageId");

      await sendAndTrackMessage(
        context,
        "Выберите команду",
        "gameMenuCommandMessageId",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "Добавить игру в список отслеживания",
              "game_add_start",
            ),
            Markup.button.callback(
              "Удалить игру из списка отслеживания",
              "game_delete_start",
            ),
          ],
          [Markup.button.callback("Отменить", "start_command_cancel")],
        ]),
      );
    });

    this.bot.hears("Управление уведомлениями", async (context: IBotContext) => {
      trackUserMessage(context, "gameMenuCommandMessageId");

      await sendAndTrackMessage(
        context,
        "Выберите команду",
        "gameMenuCommandMessageId",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "Изменить настройки по умолчанию",
              "global_subscription_start",
            ),
          ],
          [Markup.button.callback("Отменить", "start_command_cancel")],
        ]),
      );
    });
  }

  private async handleUser(context: IBotContext): Promise<User> {
    if (!context.from)
      throw new Error("Не удалось определить пользователя при добавлении.");

    const currentUser = await this.userService.getUser(context.from?.id);

    context.session.user = currentUser;

    if (!currentUser) {
      console.log("Пользователь не найден, добавляем в базу...");

      try {
        const user = await this.userService.saveUser(
          context.from?.id,
          context.from?.first_name,
        );

        console.log("Пользователь успешно сохранён в базу данных!");

        context.session.user = user;

        return user;
      } catch (error) {
        throw new Error("Ошибка сохранения пользователя:");
      }
    }

    console.log("Пользователь уже существует:", currentUser);

    return currentUser;
  }
}

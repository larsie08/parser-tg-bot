import { Markup, Telegraf } from "telegraf";

import { UserService } from "../services";

import { User } from "../entities";
import { Command, IBotContext } from "../context";
import { timeoutDeleteMessage } from "../utils";

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

      context.reply(
        `Привет! ${userName}, чем могу помочь?`,
        Markup.keyboard([["Меню парсера", "Управление играми"]]).oneTime(),
      );

      this.setupMenuHandlers();
    });

    this.bot.action("cancel_command", async (context: IBotContext) => {
      await context.deleteMessages(
        context.session.messagesId.gameMenuCommandMessageId,
      );

      const messageId = (await context.sendMessage("Отменено.")).message_id;

      timeoutDeleteMessage(context, messageId);
    });
  }

  private setupMenuHandlers(): void {
    this.bot.hears("Меню парсера", async (context: IBotContext) => {
      const userMessageId = context.message?.message_id;

      if (userMessageId) {
        context.session.messagesId.gameMenuCommandMessageId.push(
          context.message.message_id,
        );
      }

      const message = await context.reply(
        "Выберите команду",
        Markup.inlineKeyboard([
          [
            Markup.button.callback("Проверить цену игры", "check_price"),
            Markup.button.callback(
              "Узнать последние новости игры",
              "check_news",
            ),
          ],
          [Markup.button.callback("Отменить", "cancel_command")],
        ]),
      );

      context.session.messagesId.gameMenuCommandMessageId.push(
        message.message_id,
      );
    });

    this.bot.hears("Управление играми", async (context: IBotContext) => {
      const userMessageId = context.message?.message_id;

      if (userMessageId) {
        context.session.messagesId.gameMenuCommandMessageId.push(
          context.message.message_id,
        );
      }

      const message = await context.reply(
        "Выберите команду",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "Добавить игру в список отслеживания",
              "game_add_command",
            ),
            Markup.button.callback(
              "Удалить игру из списка отслеживания",
              "game_delete_command",
            ),
          ],
          [Markup.button.callback("Отменить", "cancel_command")],
        ]),
      );

      context.session.messagesId.gameMenuCommandMessageId.push(
        message.message_id,
      );
    });
  }

  private async handleUser(context: IBotContext): Promise<User> {
    if (!context.from)
      throw new Error("Не удалось определить пользователя при добавлении.");

    const currentUser = await this.userService.getUser(context.from?.id);

    if (!currentUser) {
      console.log("Пользователь не найден, добавляем в базу...");

      try {
        const user = await this.userService.saveUser(
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

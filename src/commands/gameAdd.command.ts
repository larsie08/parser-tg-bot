import { Markup, Telegraf } from "telegraf";

import { Command } from "./command.class";

import { IBotContext } from "../context/context.interface";

export class GameAddCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_add", (context) => {
      let isCanceled = false;
      const messagesId: number[] = [];

      context
        .sendMessage(
          "Введите название игры",
          Markup.inlineKeyboard([Markup.button.callback("Отменить", "cancel")])
        )
        .then((message) => messagesId.push(message.message_id));

      this.bot.hears(/.+/, (context) => {
        if (isCanceled) return;

        if (!Array.isArray(context.session.games)) {
          context.session.games = [];
        }

        context.session.games = [
          ...context.session.games,
          context.message.text,
        ];

        context
          .sendMessage("Игра успешно добавлена")
          .then((message) => messagesId.push(message.message_id));
      });

      this.bot.action("cancel", () => {
        isCanceled = true;

        context.deleteMessages(messagesId);
      });
    });
  }
}

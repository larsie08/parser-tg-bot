import { Markup, Telegraf } from "telegraf";

import { Command } from "./command.class";

import { IBotContext } from "../context/context.interface";

export class StartCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.start((context) => {
      context.reply(
        "Привет, чем могу помочь?",
        Markup.keyboard([["Меню парсера"]]).oneTime()
      );

      this.bot.hears("Меню парсера", (ctx) => {
        ctx.reply(
          "Выберите команду",
          Markup.inlineKeyboard([
            Markup.button.callback(
              "Добавить игру в список отслеживания",
              "game_add"
            ),
            Markup.button.callback("Проверить цену игры", "check_price"),
          ])
        );
      });
    });
  }
}

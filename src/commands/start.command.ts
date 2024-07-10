import { Markup, Telegraf } from "telegraf";

import { Command } from "./command.class";

import { IBotContext } from "../context/context.interface";

export class StartCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.start((context) => {
      console.log(context.session);
      context.reply(
        "Привет, чем могу помочь?",
        Markup.keyboard([["Узнать статус заказа"]])
      );
    });
  }
}

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
        "Как тебе бот?",
        Markup.inlineKeyboard([
            Markup.button.callback("like", "bot_like"),
            Markup.button.callback("dislike", "bot_dislike")
        ])
      );
    });

    this.bot.action("course_like", (context) => {
        context.session.courseLike = true
        context.editMessageText("Круто")
    })
    this.bot.action("course_dislike", (context) => {
        context.session.courseLike = false
        context.editMessageText("Грустно")
    })
  }
}

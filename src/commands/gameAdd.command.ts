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
          "Введите название игры\nПри добавлении нескольких игр, писать через запятую(,)",
          Markup.inlineKeyboard([Markup.button.callback("Отменить", "cancel")])
        )
        .then((message) => messagesId.push(message.message_id));

      isCanceled = false;

      this.bot.hears(/.+/, (context) => {
        if (isCanceled) return;

        if (!Array.isArray(context.session.games)) {
          context.session.games = [];
        }

        this.handleAddGame(context, context.message.text);

        isCanceled = true;
      });

      this.bot.action("cancel", () => {
        isCanceled = true;

        context.deleteMessages(messagesId);
      });
    });
  }

  handleAddGame(context: IBotContext, text: string) {
    if (!text.trim()) {
      return context.sendMessage("Введите название игры для добавления.");
    }

    const games = text
      .split(",")
      .map((game) => game.trim())
      .filter((game) => game.length > 0);

    if (games.length === 0) {
      return context.sendMessage("Не удалось распознать ни одной игры.");
    }

    const currentGames = context.session.games;
    const newGames = games.filter((game) => !currentGames.includes(game));

    if (newGames.length === 0) {
      return context.sendMessage("Все эти игры уже есть в вашем списке.");
    }

    context.session.games = currentGames.concat(newGames);

    if (newGames.length === 1) {
      return context.sendMessage(`Игра успешно добавлена: ${newGames}`);
    }

    context.sendMessage(`Игры успешно добавлены: ${newGames.join(", ")}`);
  }
}

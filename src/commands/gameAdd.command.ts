import { Markup, Telegraf } from "telegraf";

import { Command } from "./command.class";
import { AppDataSource } from "../config/typeOrm.config";

import { IBotContext } from "../context/context.interface";
import { Game } from "../entities";

export class GameAddCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_add", async (context) => {
      let isCanceled = false;
      const messagesId: number[] = [];

      await context
        .sendMessage(
          "Введите название игры\nПри добавлении нескольких игр, писать через запятую(,)",
          Markup.inlineKeyboard([Markup.button.callback("Отменить", "cancel")])
        )
        .then((message) => messagesId.push(message.message_id));

      isCanceled = false;

      this.bot.hears(/.+/, async (context) => {
        if (isCanceled) return;

        await this.handleAddGame(context, context.message.text);

        isCanceled = true;
      });

      this.bot.action("cancel", () => {
        isCanceled = true;

        context.deleteMessages(messagesId);
      });
    });
  }

  private async handleAddGame(context: IBotContext, text: string) {
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

    const gameRepository = AppDataSource.getRepository(Game);
    const currentGames = await gameRepository.find({
      where: { userId: context.from?.id },
    });
    const currentGameNames = currentGames.map((game) => game.name);

    const newGames = games.filter((game) => !currentGameNames.includes(game));

    if (newGames.length === 0) {
      return context.sendMessage("Все эти игры уже есть в вашем списке.");
    }

    try {
      for (const gameName of newGames) {
        const game = new Game();
        game.name = gameName;
        game.userId = context.from!.id;

        await gameRepository.save(game);
      }

      const message =
        newGames.length === 1
          ? `Игра успешно добавлена: ${newGames[0]}`
          : `Игры успешно добавлены: ${newGames.join(", ")}`;

      return context.sendMessage(message);
    } catch (error) {
      console.error("Ошибка при сохранении игр:", error);
      return context.sendMessage("Произошла ошибка при добавлении игры.");
    }
  }
}

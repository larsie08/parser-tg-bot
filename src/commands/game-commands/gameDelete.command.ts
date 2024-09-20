import { Markup, Telegraf } from "telegraf";

import { ParserCommand } from "../parser.command";
import { Command } from "../command.class";

import { AppDataSource } from "../../config/typeOrm.config";
import { IBotContext } from "../../context/context.interface";

import { Game } from "../../entities";

export class GameDeleteCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_delete", async (context) => {
      const messagesId: number[] = [];
      const parserClass = new ParserCommand(this.bot);

      const games = await parserClass.handleUserGames(context);

      if (!games || games.length === 0) {
        return context.sendMessage("У вас нет игр для удаления.");
      }

      games.forEach(async (game) => {
        await context
          .sendMessage(
            game.name,
            Markup.inlineKeyboard([
              Markup.button.callback("Удалить", `delete_${game.id}`),
            ])
          )
          .then((message) => messagesId.push(message.message_id));
      });

      await context
        .sendMessage(
          "Вы можете отменить процесс удаления:",
          Markup.inlineKeyboard([
            Markup.button.callback("Отменить", "cancel_delete"),
          ])
        )
        .then((message) => messagesId.push(message.message_id));

      this.bot.action(/delete_(\d+)/, async (ctx) => {
        const gameId = parseInt(ctx.match[1]);
        await this.handleDeleteGame(ctx, gameId, games);

        const gameMessageId = ctx.callbackQuery.message?.message_id;
        if (gameMessageId) {
          await ctx.deleteMessage(gameMessageId);
        }
      });

      this.bot.action("cancel_delete", (ctx) => {
        context.deleteMessages(messagesId);

        ctx.sendMessage("Удаление отменено.");
      });
    });
  }

  private async handleDeleteGame(
    context: IBotContext,
    gameId: number,
    games: Game[]
  ) {
    const gameRepository = AppDataSource.getRepository(Game);

    try {
      const game = games.find((game) => game.id === gameId);

      if (!game) {
        return context.sendMessage("Не удалось найти игру для удаления.");
      }

      await gameRepository.remove(game);
      context.sendMessage(`Игра "${game.name}" успешно удалена.`);
    } catch (error) {
      console.error("Ошибка при удалении игры:", error);
      context.sendMessage("Произошла ошибка при удалении игры.");
    }
  }
}

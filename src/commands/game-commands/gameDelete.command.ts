import { Markup, Telegraf } from "telegraf";

import { GameService, UserService } from "../../services";

import { Game } from "../../entities";
import { Command, IBotContext } from "../../context";

export class GameDeleteCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_delete", async (context: IBotContext) => {
      const messagesId: number[] = [];

      if (!context.from?.id) throw new Error("Не определен пользователь");

      const user = await new UserService().getUserWithGames(context.from?.id);
      const games = user?.games;

      if (!games || games.length === 0) {
        return context.sendMessage("У вас нет игр для удаления.");
      }

      for (const game of games) {
        await context
          .sendMessage(
            game.name,
            Markup.inlineKeyboard([
              Markup.button.callback("Удалить", `delete_${game.id}`),
            ]),
          )
          .then((message) => messagesId.push(message.message_id));
      }

      await context
        .sendMessage(
          "Вы можете отменить процесс удаления:",
          Markup.inlineKeyboard([
            Markup.button.callback("Отменить", "cancel_delete"),
          ]),
        )
        .then((message) => messagesId.push(message.message_id));

      this.bot.action("cancel_delete", async (ctx) => {
        context.deleteMessages(messagesId);

        await ctx.sendMessage("Удаление отменено.");
      });
    });

    this.bot.action(/delete_(\d+)/, async (context: IBotContext) => {
      const selectedGameName = (context.callbackQuery?.message as any).text;

      const game = await new GameService().getUserGame(selectedGameName);

      if (!game) throw new Error(`Не удалось найти игру при удалении: ${game}`);

      await this.handleDeleteGame(context, game);

      const gameMessageId = context.callbackQuery?.message?.message_id;
      if (gameMessageId) {
        await context.deleteMessage(gameMessageId);
      }
    });
  }

  private async handleDeleteGame(context: IBotContext, game: Game) {
    try {
      await new GameService().deleteGame(game);
      await context.sendMessage(`Игра "${game.name}" успешно удалена.`);
    } catch (error) {
      console.error("Ошибка при удалении игры:", error);
      await context.sendMessage("Произошла ошибка при удалении игры.");
    }
  }
}

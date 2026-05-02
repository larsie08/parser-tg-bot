import { Markup, Telegraf } from "telegraf";

import { GameService, UserService } from "../../services";
import {
  notifyUserAboutError,
  sendAndTrackMessage,
  timeoutDeleteMessage,
} from "../../utils";

import { Game } from "../../entities";
import { Command, IBotContext } from "../../context";

export class GameDeleteCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private userService: UserService,
    private gameService: GameService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_delete", async (context: IBotContext) => {
      const user = await this.userService.getUserWithGames(context.from!.id);
      const games = user?.games;

      if (!games || games.length === 0)
        return notifyUserAboutError(context, "У вас нет игр для удаления.");

      for (const game of games) {
        await context
          .sendMessage(
            game.name,
            Markup.inlineKeyboard([
              Markup.button.callback("Удалить", `delete_${game.id}`),
            ]),
          )
          .then((message) =>
            context.session.messagesId.gameDeleteMessagesId.push(
              message.message_id,
            ),
          );
      }

      await context
        .sendMessage(
          "Вы можете отменить процесс удаления:",
          Markup.inlineKeyboard([
            Markup.button.callback("Отменить", "cancel_delete"),
          ]),
        )
        .then((message) =>
          context.session.messagesId.gameDeleteMessagesId.push(
            message.message_id,
          ),
        );
    });

    this.bot.action(/delete_(\d+)/, async (context: IBotContext) => {
      const selectedGameName: string =
        context.callbackQuery?.message &&
        "text" in context.callbackQuery.message
          ? context.callbackQuery.message.text
          : "";

      if (!selectedGameName)
        return notifyUserAboutError(context, "Ошибка при выборе игры.");

      const game = await new GameService().getUserGame(selectedGameName);

      if (!game)
        return notifyUserAboutError(
          context,
          `Не удалось найти игру при удалении: ${game}`,
        );

      await this.handleDeleteGame(context, game);

      await sendAndTrackMessage(
        context,
        `Игра "${game.name}" успешно удалена.`,
        "gameDeleteMessagesId",
      );

      if (context.callbackQuery?.message) {
        try {
          const gameMessageId = context.callbackQuery?.message?.message_id;

          await context.deleteMessage(gameMessageId);
        } catch (error) {
          console.error("Не удалось удалить сообщение пользователя.", error);
        }
      }
    });

    this.bot.action("cancel_delete", async (context: IBotContext) => {
      await context.deleteMessages(
        context.session.messagesId.gameDeleteMessagesId,
      );

      const message = await context.sendMessage("Удаление отменено.");

      timeoutDeleteMessage(context, message.message_id);
    });
  }

  private async handleDeleteGame(context: IBotContext, game: Game) {
    try {
      await this.userService.deleteUserGame(context.from!.id, game);
      await this.gameService.deleteGame(game);
    } catch (error) {
      console.error("Ошибка при удалении игры:", error);
      await sendAndTrackMessage(
        context,
        "Произошла ошибка при удалении игры.",
        "gameDeleteMessagesId",
      );
    }
  }
}

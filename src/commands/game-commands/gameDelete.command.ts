import { Markup, Telegraf } from "telegraf";

import { GameService, UserService } from "../../services";
import {
  cancelOperationMessage,
  getGameNameFromMessageCallback,
  notifyUserAboutError,
  sendAndTrackMessage,
  showGameSelectionMenu,
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
    this.bot.action("game_delete_start", async (context: IBotContext) => {
      const games = await this.gameService.getUserAllGames(
        context.session.user!.userId,
      );

      if (!games || games.length === 0)
        return notifyUserAboutError(context, "У вас нет игр для удаления.");

      await showGameSelectionMenu(
        context,
        games,
        "gameDeleteMessagesId",
        "Вы можете отменить процесс удаления:",
        Markup.inlineKeyboard([
          Markup.button.callback("Удалить", `game_delete_select`),
        ]),
        Markup.inlineKeyboard([
          Markup.button.callback("Отменить", "game_delete_cancel"),
        ]),
      );
    });

    this.bot.action("game_delete_select", async (context: IBotContext) => {
      const selectedGameName = getGameNameFromMessageCallback(context);

      if (!selectedGameName)
        return notifyUserAboutError(context, "Ошибка при выборе игры.");

      const game = await this.gameService.getUserGame(selectedGameName);

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

    this.bot.action("game_delete_cancel", async (context: IBotContext) => {
      await cancelOperationMessage(
        context,
        "gameDeleteMessagesId",
        null,
        "Отмена операции по удалению.",
      );
    });
  }

  private async handleDeleteGame(
    context: IBotContext,
    game: Game,
  ): Promise<void> {
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

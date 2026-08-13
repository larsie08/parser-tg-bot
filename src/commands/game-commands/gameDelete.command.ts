import { Telegraf } from "telegraf";

import { GameService, UserService } from "../../services";
import {
  buildGamePaginationMarkUp,
  cancelOperationMessage,
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
        0,
        "gameDeleteMessagesId",
        "game_delete",
        true,
      );
    });

    this.bot.action(
      /^game_delete_select:(\d+):(\d+)$/,
      async (context: IBotContext) => {
        const gameId = Number(context.match?.[1]);
        const page = Number(context.match?.[2]);

        if (!gameId)
          return notifyUserAboutError(context, "Ошибка при выборе игры.");

        const game = await this.gameService.getUserGame(gameId);

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

        const games = await this.gameService.getUserAllGames(
          context.session.user!.userId,
        );

        await context.editMessageReplyMarkup(
          buildGamePaginationMarkUp(games, page, "game_delete", true)
            .reply_markup,
        );

        await context.answerCbQuery();
      },
    );

    this.bot.action(
      /^game_delete_toggle_page:(\d+)$/,
      async (context: IBotContext) => {
        const page = Number(context.match?.[1]);

        const games = await this.gameService.getUserAllGames(
          context.session.user!.userId,
        );

        await context.editMessageReplyMarkup(
          buildGamePaginationMarkUp(games, page, "game_delete", true)
            .reply_markup,
        );

        await context.answerCbQuery();
      },
    );

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
      await notifyUserAboutError(
        context,
        "Произошла ошибка при удалении игры.",
      );
    }
  }
}

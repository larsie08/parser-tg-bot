import { Telegraf } from "telegraf";

import { TelegramService } from "../../services";
import { Game, GameService, UserService } from "../../modules";
import { buildGamePaginationMarkUp } from "../../shared";

import { Command, IBotContext } from "../../context";

export class GameDeleteCommand extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly userService: UserService,
    private readonly gameService: GameService,
    private readonly telegramService: TelegramService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_delete_start", async (context: IBotContext) => {
      const games = await this.gameService.getUserAllGames(
        context.session.user!.userId,
      );

      if (!games || games.length === 0)
        return this.telegramService.notifyUserAboutError(
          context,
          "У вас нет игр для удаления.",
        );

      const markup = buildGamePaginationMarkUp(games, 0, "game_delete", true);

      await this.telegramService.sendAndTrackMessage(
        context,
        "📰 *Выберите игру:*",
        "gameDeleteMessagesId",
        markup,
      );
    });

    this.bot.action(
      /^game_delete_select:(\d+):(\d+)$/,
      async (context: IBotContext) => {
        const gameId = Number(context.match?.[1]);
        const page = Number(context.match?.[2]);

        if (!gameId)
          return this.telegramService.notifyUserAboutError(
            context,
            "Ошибка при выборе игры.",
          );

        const game = await this.gameService.getUserGame(gameId);

        if (!game)
          return this.telegramService.notifyUserAboutError(
            context,
            `Не удалось найти игру при удалении: ${game}`,
          );

        await this.handleDeleteGame(context, game);

        await this.telegramService.sendAndTrackMessage(
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
      await this.telegramService.cancelOperationMessage(
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
      await this.telegramService.notifyUserAboutError(
        context,
        "Произошла ошибка при удалении игры.",
      );
    }
  }
}

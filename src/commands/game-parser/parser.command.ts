import { Telegraf } from "telegraf";

import { TelegramService } from "../../services";
import { SteamService } from "../../integrations";
import { GameMetaService, GameService, getDiffData, hasMetaData } from "../../modules";

import {
  buildGamePaginationMarkUp,
  createGameMessage,
  formatReleaseDate,
} from "../../shared";

import { Command, IBotContext } from "../../context";

export class ParserCommand extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameMetaService: GameMetaService,
    private readonly gameService: GameService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("price_check_start", async (context: IBotContext) => {
      await this.handleGameSelection(context);
    });

    this.bot.action(
      /^price_check_select:(\d+)$/,
      async (context: IBotContext) => {
        const gameId = Number(context.match?.[1]);

        await this.handleSteamPrice(context, gameId);
      },
    );

    this.bot.action(
      /^price_check_toggle_page:(\d+)$/,
      async (context: IBotContext) => {
        const page = Number(context.match?.[1]);

        const games = await this.gameService.getUserAllGames(
          context.session.user!.userId,
        );

        await context.editMessageReplyMarkup(
          buildGamePaginationMarkUp(games, page, "price_check").reply_markup,
        );

        await context.answerCbQuery();
      },
    );

    this.bot.action("price_check_cancel", async (context: IBotContext) => {
      await this.telegramService.cancelOperationMessage(
        context,
        "gameParserMessageId",
        null,
      );
    });
  }

  private async handleGameSelection(context: IBotContext): Promise<void> {
    const games = await this.gameService.getUserAllGames(
      context.session.user!.userId,
    );

    if (!games?.length)
      return this.telegramService.notifyUserAboutError(
        context,
        "В списке отслеживаемого ничего не найдено",
      );

    context.session.state = "WAITING_GAME";

    const markup = buildGamePaginationMarkUp(games, 0, "price_check");

    await this.telegramService.sendAndTrackMessage(
      context,
      "📰 *Выберите игру:*",
      "gameParserMessageId",
      markup,
    );
  }

  private async handleSteamPrice(
    context: IBotContext,
    gameId: number,
  ): Promise<void> {
    const game = await this.gameService.getUserGame(gameId);

    if (!game) throw new Error("Не удалось найти игру в базе данных.");

    const gameData = await this.steamService.fetchGameMetaInfoRegionalSteam(
      game.steamId,
    );

    if (!gameData)
      return this.telegramService.notifyUserAboutError(
        context,
        "Не удалось получить данные о цене игры.",
      );

    const changesDetected = getDiffData(game, gameData);
    const hasAnyChange = Object.keys(changesDetected).length > 0;
    const changesKeys = Object.keys(changesDetected);

    if (!hasMetaData(game.meta) || hasAnyChange)
      await this.gameMetaService.upsertMetaInfo(gameData, game);

    const releaseDate = changesKeys.includes("releaseDate")
      ? (() => {
          const date = gameData.releaseDate ?? game.meta.releaseDate;
          return date ? formatReleaseDate(date) : undefined;
        })()
      : undefined;

    await this.telegramService.sendAndTrackMessage(
      context,
      createGameMessage(gameData, game, changesDetected, releaseDate),
      "gameParserMessageId",
    );
  }
}

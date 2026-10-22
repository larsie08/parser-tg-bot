import { Telegraf } from "telegraf";

import { TelegramService } from "../../telegram.service";
import { SteamService } from "../../../integrations";
import {
  buildGamePaginationMarkUp,
  createGameMessage,
  GameMetaType,
  GameService,
  getDiffMeta,
  hasMetaData,
  PriceHistoryService,
  PriceTrackingService,
} from "../../../modules";

import { formatReleaseDate } from "../../../shared";

import { Command, IBotContext } from "../../";

export class ParserCommand extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameService: GameService,
    private readonly priceTrackingService: PriceTrackingService,
    private readonly priceHistoryService: PriceHistoryService,
    private readonly steamService: SteamService,
    private readonly telegramService: TelegramService,
  ) {
    super(bot);
  }

  async handle(): Promise<void> {
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

    const changesDetected = getDiffMeta(game.meta, gameData, game.additions);
    const hasAnyChange = Object.keys(changesDetected).length > 0;
    const changesKeys = Object.keys(changesDetected);

    const lowestPriceInHistory =
      await this.priceHistoryService.getLowestPriceInHistory(game.meta.id);

    const releaseDate = changesKeys.includes("releaseDate")
      ? (() => {
          const date = gameData.releaseDate ?? game.meta.releaseDate;
          return date ? formatReleaseDate(date) : undefined;
        })()
      : undefined;

    await this.telegramService.sendAndTrackMessage(
      context,
      createGameMessage(
        gameData,
        game,
        changesDetected,
        releaseDate,
        lowestPriceInHistory,
      ),
      "gameParserMessageId",
    );

    if (!hasMetaData(game.meta) || hasAnyChange)
      await this.priceTrackingService.processSaveMetaInfoAndHistory(
        gameData,
        game.id,
        GameMetaType.GAME,
      );
  }
}

import { Markup, Telegraf } from "telegraf";

import { GameMetaService, GameService, SteamService } from "../../services";
import {
  cancelOperationMessage,
  createGameMessage,
  getDiffData,
  getGameNameFromMessageCallback,
  hasMetaData,
  notifyUserAboutError,
  sendAndTrackMessage,
  showGameSelectionMenu,
} from "../../utils";

import { Command, IBotContext } from "../../context";

export class ParserCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private gameMetaService: GameMetaService,
    private gameService: GameService,
    private steamService: SteamService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("price_check_start", async (context: IBotContext) => {
      await this.handleGameSelection(context);
    });

    this.bot.action("price_check_game", async (context: IBotContext) => {
      const parserSelectedGame = getGameNameFromMessageCallback(context);

      await this.handleSteamPrice(context, parserSelectedGame);
    });

    this.bot.action("price_check_cancel", async (context: IBotContext) => {
      await cancelOperationMessage(context, "gameParserMessageId", null);
    });
  }

  private async handleGameSelection(context: IBotContext): Promise<void> {
    const games = await this.gameService.getUserAllGames(
      context.session.user!.userId,
    );

    if (!games?.length)
      return notifyUserAboutError(
        context,
        "В списке отслеживаемого ничего не найдено",
      );

    context.session.state = "WAITING_GAME";

    await showGameSelectionMenu(
      context,
      games,
      "gameParserMessageId",
      "Отменить",
      Markup.inlineKeyboard([
        Markup.button.callback("Узнать цену", "price_check_game"),
      ]),
      Markup.inlineKeyboard([
        Markup.button.callback("Отменить", "price_check_cancel"),
      ]),
    );
  }

  private async handleSteamPrice(
    context: IBotContext,
    parserSelectedGame: string,
  ): Promise<void> {
    const game = await this.gameService.getUserGame(parserSelectedGame);

    if (!game) throw new Error("Не удалось найти игру в базе данных.");

    const gameData = await this.steamService.fetchGameMetaInfoRegionalSteam(
      game.steamId,
    );

    if (!gameData)
      return notifyUserAboutError(
        context,
        "Не удалось получить данные о цене игры.",
      );

    const changesDetected = getDiffData(game, gameData);

    const hasAnyChange = Object.keys(changesDetected).length > 0;

    if (!hasMetaData(game.meta) || hasAnyChange)
      await this.gameMetaService.upsertMetaInfo(gameData, game);

    await sendAndTrackMessage(
      context,
      createGameMessage(gameData, game, changesDetected),
      "gameParserMessageId",
    );
  }
}

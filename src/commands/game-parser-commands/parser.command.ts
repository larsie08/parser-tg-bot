import { Markup, Telegraf } from "telegraf";

import {
  GameMetaService,
  GameService,
  SteamService,
  UserService,
} from "../../services";
import {
  createGameMessage,
  notifyUserAboutError,
  sendAndTrackMessage,
  timeoutDeleteMessage,
} from "../../utils";

import { Command, IBotContext, IGameSteamData } from "../../context";
import { Game } from "../../entities";

export class ParserCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private gameMetaService: GameMetaService,
    private userService: UserService,
    private gameService: GameService,
    private steamService: SteamService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("check_price", async (context) => {
      await this.handleGameSelection(context);
    });

    this.bot.action("check__game_price", async (context: IBotContext) => {
      context.session.parserSelectedGame =
        context.callbackQuery?.message &&
        "text" in context.callbackQuery.message
          ? context.callbackQuery.message.text
          : "";

      await context
        .sendMessage("Выберите ресурс", Markup.keyboard(["Steam", "Отменить"]))
        .then((message) =>
          context.session.messagesId.gameParserMessageId.push(
            message.message_id,
          ),
        );
    });

    this.bot.hears(
      "Steam",
      async (context: IBotContext) => await this.handleSteamPrice(context),
    );

    this.bot.hears("Отменить", (context: IBotContext) => {
      const userMessageId = context.message?.message_id;

      this.cancelOperation(context, userMessageId);
    });
  }

  private async handleGameSelection(context: IBotContext): Promise<void> {
    if (!context.from) {
      return notifyUserAboutError(
        context,
        "Ошибка: не удалось определить пользователя.",
      );
    }

    const user = await this.userService.getUserWithGames(context.from.id);
    const games = user?.games;

    if (!games?.length)
      return notifyUserAboutError(
        context,
        "В списке отслеживаемого ничего не найдено",
      );

    context.session.state = "WAITING_GAME";

    for (const game of games) {
      await context
        .sendMessage(
          game.name,
          Markup.inlineKeyboard([
            Markup.button.callback("Узнать цену", "check__game_price"),
          ]),
        )
        .then((message) =>
          context.session.messagesId.gameParserMessageId.push(
            message.message_id,
          ),
        );
    }
  }

  private async handleSteamPrice(context: IBotContext): Promise<void> {
    if (!context.session.parserSelectedGame)
      throw new Error(
        `Произошла ошибка с контекстом бота ${context.session.parserSelectedGame}`,
      );

    const game = await this.gameService.getUserGame(
      context.session.parserSelectedGame,
    );

    if (!game) throw new Error("Не удалось найти игру в базе данных.");

    const gameData = await this.steamService.fetchGameMetaInfoSteam(
      game.steamId,
    );

    if (!gameData)
      return notifyUserAboutError(
        context,
        "Не удалось получить данные о цене игры.",
      );

    await this.updateGameInfo(gameData, game);

    await sendAndTrackMessage(
      context,
      createGameMessage(gameData, game),
      "gameParserMessageId",
    );
  }

  private async updateGameInfo(
    gameData: IGameSteamData,
    game: Game,
  ): Promise<void> {
    if (
      (!gameData.releaseDate || !gameData.releaseTime) &&
      gameData.price === game.meta?.price
    )
      return;

    return await this.gameMetaService.upsertMetaInfo(gameData, game);
  }

  private async cancelOperation(
    context: IBotContext,
    userMessageId: number | undefined,
  ): Promise<void> {
    if (userMessageId) await context.deleteMessage(userMessageId);

    await context.deleteMessages(
      context.session.messagesId.gameParserMessageId,
    );

    context.session.state = null;

    const message = await context.sendMessage("Отмена операции.");

    timeoutDeleteMessage(context, message.message_id);
  }
}

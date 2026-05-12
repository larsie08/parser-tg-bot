import { Markup, Telegraf } from "telegraf";

import { GameService, SteamService, UserService } from "../../services";
import {
  handleFormatUrlSearch,
  notifyUserAboutError,
  sendAndTrackMessage,
} from "../../utils";

import { User } from "../../entities";
import { Command, IBotContext, PendingGame } from "../../context";

export class GameAddCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private userService: UserService,
    private gameService: GameService,
    private steamService: SteamService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_add_command", async (context: IBotContext) => {
      await context
        .sendMessage(
          "Введите название игры\nПри добавлении нескольких игр, писать через запятую(,)",
          Markup.inlineKeyboard([Markup.button.callback("Отменить", "cancel")]),
        )
        .then((message) =>
          context.session.messagesId.gameAddMessagesId.push(message.message_id),
        );

      context.session.state = null;

      this.bot.hears(/.+/, async (context) => {
        if (typeof context.session.state === "string") return;

        context.session.messagesId.gameAddMessagesId.push(
          context.message?.message_id,
        );

        await this.handleAddGame(context, context.message?.text);

        context.session.state = "WAITING_GAME";
      });
    });

    this.bot.action("cancel", async (context: IBotContext) => {
      context.session.state = "CANCELED_GAME";

      await context.deleteMessages(
        context.session.messagesId.gameAddMessagesId,
      );

      context.session.messagesId.gameAddMessagesId = [];
    });

    this.bot.action("confirm_add_game", async (context) => {
      const game = context.session.pendingGame?.shift();

      if (!game)
        return notifyUserAboutError(
          context,
          "Произошла ошибка при выборе игры.",
        );

      if (context.session.lastAskNextGameMessageId)
        await context.deleteMessage(context.session.lastAskNextGameMessageId);

      await this.saveGame(game.steamGameName, game.steamId, game.user);

      await sendAndTrackMessage(
        context,
        `Игра успешно добавлена ${game.steamGameName}`,
        "gameAddMessagesId",
      );

      return await this.askNextGame(context);
    });

    this.bot.action("confirm_cancel_game", async (context) => {
      const game = context.session.pendingGame?.shift();
      context.session.state = null;

      if (context.session.lastAskNextGameMessageId)
        await context.deleteMessage(context.session.lastAskNextGameMessageId);

      await sendAndTrackMessage(
        context,
        `Отмена операции по добавлению ${game?.steamGameName}.`,
        "gameAddMessagesId",
      );

      await this.askNextGame(context);
    });
  }

  private async handleAddGame(context: IBotContext, text: string) {
    const games = this.parseGameNamesFromMessage(text);

    if (games.length === 0)
      return notifyUserAboutError(
        context,
        "Не удалось распознать ни одной игры.",
      );

    const user = await this.userService.getUserWithGames(context.from!.id);

    if (!user) return console.log("Пользователь не найден.", context.from);

    try {
      const { addedGames, pendingGames } = await this.processGames(games, user);

      const { newGames, alreadyAddedGames } = this.filterGames(
        pendingGames,
        user,
        context,
      );

      if (newGames.length === 0)
        return notifyUserAboutError(
          context,
          "Все эти игры уже есть в вашем списке.",
        );

      if (newGames.length > 0) {
        context.session.pendingGame = newGames;

        await this.askNextGame(context);
      }

      if (alreadyAddedGames.length > 0) {
        await sendAndTrackMessage(
          context,
          this.editMessageGames(
            alreadyAddedGames.map((game) => game.steamGameName),
            true,
          ),
          "gameAddMessagesId",
        );
      }

      await sendAndTrackMessage(
        context,
        this.editMessageGames(
          addedGames.map((game) => game.steamGameName),
          false,
          pendingGames,
        ),
        "gameAddMessagesId",
      );
    } catch (error) {
      console.error("Ошибка при сохранении игр:", error);
      return notifyUserAboutError(
        context,
        "Произошла ошибка при добавлении игры.",
      );
    }
  }

  private parseGameNamesFromMessage(text: string): string[] {
    if (!text?.trim()) return [];

    return text
      .split(",")
      .map((game) => game.trim())
      .filter((game) => game.length > 0);
  }

  private filterGames(
    games: PendingGame[],
    user: User,
    context: IBotContext,
  ): { newGames: PendingGame[]; alreadyAddedGames: PendingGame[] } {
    const existingIds = user.games.map((g) => g.steamId);

    return {
      newGames: games.filter((g) => !existingIds.includes(g.steamId)),
      alreadyAddedGames: games.filter((g) => existingIds.includes(g.steamId)),
    };
  }

  private async processGames(
    games: string[],
    user: User,
  ): Promise<{
    addedGames: { steamGameName: string; steamId: string }[];
    pendingGames: PendingGame[];
  }> {
    const addedGames: { steamGameName: string; steamId: string }[] = [];
    const pendingGames: PendingGame[] = [];

    for (const gameName of games) {
      const steamInfo = await this.getSteamInfo(gameName);

      if (steamInfo.name.toLowerCase() === gameName.toLowerCase()) {
        await this.saveGame(steamInfo.name, steamInfo.steamId, user);
        addedGames.push({
          steamGameName: steamInfo.name,
          steamId: steamInfo.steamId,
        });
        continue;
      }

      pendingGames.push({
        steamGameName: steamInfo.name,
        steamId: steamInfo.steamId,
        user,
        href: steamInfo.href,
      });
    }

    return { addedGames, pendingGames };
  }

  private async getSteamInfo(
    gameName: string,
  ): Promise<{ name: string; steamId: string; href: string }> {
    const url = handleFormatUrlSearch(gameName);
    const data = await this.steamService.fetchGameIdSteam(url);

    if (!data) {
      throw new Error("Ошибка при получении данных с Steam:");
    }

    return {
      name: data.name,
      steamId: data.href.split("/")[4],
      href: data.href,
    };
  }

  private async saveGame(
    name: string,
    steamId: string,
    user: User,
  ): Promise<void> {
    try {
      const game = await this.gameService.saveGame(name, steamId);
      await this.userService.addUserGame(user, game);
    } catch (error) {
      console.error("Произошла ошибка при добавлениие игры.", error);
    }
  }

  private async askNextGame(context: IBotContext): Promise<void> {
    if (context.session.pendingGame.length === 0) return;

    const game = context.session.pendingGame?.[0];

    if (!game) {
      return notifyUserAboutError(context, "Произошла ошибка при выборе игры.");
    }

    await context
      .sendMessage(
        `Добавить игру?\nНазвание: ${game.steamGameName}\nСсылка: ${game.href}`,
        Markup.inlineKeyboard([
          Markup.button.callback("Добавить", "confirm_add_game"),
          Markup.button.callback("Отменить", "confirm_cancel_game"),
        ]),
      )
      .then(
        (message) =>
          (context.session.lastAskNextGameMessageId = message.message_id),
      );
  }

  private editMessageGames(
    games: string[],
    isAlreadyAddedGames: boolean,
    pendingGames?: PendingGame[],
  ): string {
    if (isAlreadyAddedGames)
      return games.length === 1
        ? `Игра уже находится в вашем списке: ${games[0]}`
        : `Игры уже есть в вашем списке: ${games.join(", ")}`;

    if (pendingGames && pendingGames?.length > 0) {
      const gameNames = pendingGames.map((game) => game.steamGameName);
      return games.length === 0
        ? `Следующие игры ожидают подтверждения: ${gameNames.join(", ")}`
        : games.length === 1
          ? `Следующие игры ожидают подтверждения: ${gameNames.join(", ")}\nИгра успешно добавлена: ${games[0]}`
          : `Следующие игры ожидают подтверждения: ${gameNames.join(", ")}\nИгры успешно добавлены: ${games.join(", ")}`;
    }

    return games.length === 0
      ? "Игра не была добавлена"
      : games.length === 1
        ? `Игра успешно добавлена: ${games[0]}`
        : `Игры успешно добавлены: ${games.join(", ")}`;
  }
}

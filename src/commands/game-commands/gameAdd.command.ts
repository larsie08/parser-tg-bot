import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import { JSDOM } from "jsdom";

import { GameService, UserService } from "../../services";

import { User } from "../../entities";
import { Command, IBotContext, PendingGame } from "../../context";
import { handleFormatUrlSearch, notifyUserAboutError } from "../../utils";

export class GameAddCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private userService: UserService,
    private gameService: GameService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_add", async (context: IBotContext) => {
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

      await context
        .sendMessage(`Игра успешно добавлена ${game.steamGameName}`)
        .then((message) =>
          context.session.messagesId.gameAddMessagesId.push(message.message_id),
        );

      return await this.askNextGame(context);
    });

    this.bot.action("confirm_cancel_game", async (context) => {
      const game = context.session.pendingGame?.shift();
      context.session.state = null;

      if (context.session.lastAskNextGameMessageId)
        await context.deleteMessage(context.session.lastAskNextGameMessageId);

      await context
        .sendMessage(`Отмена операции по добавлению ${game?.steamGameName}.`)
        .then((message) =>
          context.session.messagesId.gameAddMessagesId.push(message.message_id),
        );

      await this.askNextGame(context);
    });
  }

  private async handleAddGame(context: IBotContext, text: string) {
    if (!text.trim())
      return notifyUserAboutError(
        context,
        "Введите название игры для добавления.",
      );

    const games = text
      .split(",")
      .map((game) => game.trim())
      .filter((game) => game.length > 0);

    if (games.length === 0)
      return notifyUserAboutError(
        context,
        "Не удалось распознать ни одной игры.",
      );

    const user = await this.userService?.getUserWithGames(context.from!.id);

    if (!user) return console.log("Пользователь не найден.", context.from);

    const userNameGames =
      user?.games.map((game) => game.name.toLowerCase()) || [];

    const newGames = games.filter((game) => !userNameGames?.includes(game));
    const alreadyAddedGames = games.filter((game) =>
      userNameGames.includes(game),
    );

    if (newGames.length === 0)
      return notifyUserAboutError(
        context,
        "Все эти игры уже есть в вашем списке.",
      );

    if (alreadyAddedGames.length > 0) {
      const message = this.editMessageGames(alreadyAddedGames, true);

      await context
        .sendMessage(message)
        .then((message) =>
          context.session.messagesId.gameAddMessagesId.push(message.message_id),
        );
    }

    const pendingGames: PendingGame[] = [];
    const addedGames: string[] = [];

    try {
      for (const gameName of newGames) {
        const steamInfo = await this.getSteamInfo(gameName);

        if (steamInfo.name.toLowerCase() === gameName.toLowerCase()) {
          await this.saveGame(steamInfo.name, steamInfo.steamId, user);
          addedGames.push(steamInfo.name);
          continue;
        }

        pendingGames.push({
          steamGameName: steamInfo.name,
          steamId: steamInfo.steamId,
          user,
          href: steamInfo.href,
        });
      }

      if (pendingGames.length > 0) {
        context.session.pendingGame = pendingGames;

        await this.askNextGame(context);
      }

      const message = this.editMessageGames(addedGames, false, pendingGames);

      await context
        .sendMessage(message)
        .then((message) =>
          context.session.messagesId.gameAddMessagesId.push(message.message_id),
        );
    } catch (error) {
      console.error("Ошибка при сохранении игр:", error);
      return notifyUserAboutError(
        context,
        "Произошла ошибка при добавлении игры.",
      );
    }
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
    const game = context.session.pendingGame?.[0];

    if (!game)
      return notifyUserAboutError(context, "Произошла ошибка при выборе игры.");

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

  private async getSteamInfo(
    gameName: string,
  ): Promise<{ name: string; steamId: string; href: string }> {
    const url = handleFormatUrlSearch(gameName);
    const data = await this.fetchGameInfoSteam(url);

    if (!data) {
      throw new Error("Ошибка при получении данных с Steam:");
    }

    return {
      name: data.name,
      steamId: data.href.split("/")[4],
      href: data.href,
    };
  }

  private async fetchGameInfoSteam(
    gameUrl: string,
  ): Promise<{ href: string; name: string } | null> {
    try {
      const { data } = await axios.get(
        `https://store.steampowered.com/search/?term=${gameUrl}&ignore_preferences=1`,
      );
      return this.parseSteamIdData(data);
    } catch (error) {
      console.error("Ошибка при получении данных с Steam:", error);
      return null;
    }
  }

  private parseSteamIdData(
    data: string,
  ): { href: string; name: string } | null {
    try {
      const dom = new JSDOM(data);
      const gameBlock = dom.window.document
        .getElementById("search_resultsRows")
        ?.querySelector("a");

      const gameName = gameBlock
        ?.getElementsByClassName("search_name")[0]
        .querySelector("span")?.textContent;

      if (!gameName || !gameBlock.href) {
        console.log("Ошибка при разборе данных Steam:", gameName, gameBlock);
        return null;
      }

      return { href: gameBlock.href, name: gameName };
    } catch (error) {
      console.error("Ошибка при разборе данных Steam:", error);
      return null;
    }
  }
}

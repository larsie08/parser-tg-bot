import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import { JSDOM } from "jsdom";

import { Command } from "../command.class";
import { ParserCommand } from "../game-parser-commands/parser.command";
import { AppDataSource } from "../../config/typeOrm.config";

import { Game, User } from "../../entities";
import { IBotContext, PendingGame } from "../../context";
import { UserService } from "../../services/user.service";

export class GameAddCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_add", async (context) => {
      const messagesId: number[] = [];

      await context
        .sendMessage(
          "Введите название игры\nПри добавлении нескольких игр, писать через запятую(,)",
          Markup.inlineKeyboard([Markup.button.callback("Отменить", "cancel")]),
        )
        .then((message) => messagesId.push(message.message_id));

      context.session.state = null;

      this.bot.hears(/.+/, async (context) => {
        if (typeof context.session.state === "string") return;

        await this.handleAddGame(context, context.message.text);

        context.session.state = "WAITING_GAME";
      });

      this.bot.action("cancel", () => {
        context.session.state = "CANCELED_GAME";
        context.deleteMessages(messagesId);
      });
    });

    this.bot.action("confirm_add_game", async (context) => {
      const game = context.session.pendingGame?.shift();

      if (!game) {
        return;
      }

      await this.saveGame(game.steamGameName, game.steamId, game.user);

      await context.sendMessage(`Игра успешно добавлена ${game.steamGameName}`);

      return await this.askNextGame(context);
    });

    this.bot.action("confirm_cancel_game", async (context) => {
      const game = context.session.pendingGame?.shift();
      context.session.state = null;

      await context.sendMessage(
        `Отмена операции по добавлению ${game?.steamGameName}.`,
      );

      await this.askNextGame(context);
    });
  }

  private async handleAddGame(context: IBotContext, text: string) {
    if (!text.trim()) {
      return context.sendMessage("Введите название игры для добавления.");
    }

    if (!context.from?.id) throw new Error("Не определен пользователь");

    const games = text
      .split(",")
      .map((game) => game.trim())
      .filter((game) => game.length > 0);

    if (games.length === 0) {
      return await context.sendMessage("Не удалось распознать ни одной игры.");
    }

    const user = await new UserService().getUserWithGames(context.from?.id);

    if (!user) {
      return context.sendMessage("Пользователь не найден.");
    }

    const userGames = user?.games;

    const currentGameNames =
      userGames?.map((game) => game.name.toLowerCase()) || [];

    const newGames = games.filter((game) => !currentGameNames?.includes(game));
    const alreadyAddedGames = games.filter((game) =>
      currentGameNames.includes(game),
    );

    if (newGames.length === 0) {
      return await context.sendMessage("Все эти игры уже есть в вашем списке.");
    }

    if (alreadyAddedGames.length > 0) {
      const message = this.editMessageGames(alreadyAddedGames, true);

      await context.sendMessage(message);
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

      return await context.sendMessage(message);
    } catch (error) {
      console.error("Ошибка при сохранении игр:", error);
      return await context.sendMessage("Произошла ошибка при добавлении игры.");
    }
  }

  private async saveGame(name: string, steamId: string, user: User) {
    const gameRepository = AppDataSource.getRepository(Game);

    const game = gameRepository.create({
      name,
      steamId,
      user,
    });

    await gameRepository.save(game);
  }

  private async askNextGame(context: IBotContext) {
    const game = context.session.pendingGame?.[0];

    if (!game) {
      return;
    }

    await context.sendMessage(
      `Добавить игру?\nНазвание: ${game.steamGameName}\nСсылка: ${game.href}`,
      Markup.inlineKeyboard([
        Markup.button.callback("Добавить", "confirm_add_game"),
        Markup.button.callback("Отменить", "confirm_cancel_game"),
      ]),
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
    const parserCommand = new ParserCommand(this.bot);

    const url = parserCommand.handleFormatUrlSearch(gameName);
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

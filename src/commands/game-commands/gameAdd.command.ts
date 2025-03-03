import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import { JSDOM } from "jsdom";

import { Command } from "../command.class";
import { ParserCommand } from "../game-parser-commands/parser.command";
import { AppDataSource } from "../../config/typeOrm.config";

import { IBotContext } from "../../context/context.interface";
import { Game } from "../../entities";

export class GameAddCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_add", async (context) => {
      let isCanceled = false;
      const messagesId: number[] = [];

      await context
        .sendMessage(
          "Введите название игры\nПри добавлении нескольких игр, писать через запятую(,)",
          Markup.inlineKeyboard([Markup.button.callback("Отменить", "cancel")])
        )
        .then((message) => messagesId.push(message.message_id));

      isCanceled = false;

      this.bot.hears(/.+/, async (context) => {
        if (isCanceled) return;

        await this.handleAddGame(context, context.message.text);

        isCanceled = true;
      });

      this.bot.action("cancel", () => {
        isCanceled = true;

        context.deleteMessages(messagesId);
      });
    });
  }

  private async handleAddGame(context: IBotContext, text: string) {
    if (!text.trim()) {
      return context.sendMessage("Введите название игры для добавления.");
    }

    const games = text
      .split(",")
      .map((game) => game.trim())
      .filter((game) => game.length > 0);

    if (games.length === 0) {
      return context.sendMessage("Не удалось распознать ни одной игры.");
    }

    const gameRepository = AppDataSource.getRepository(Game);
    const currentGames = await gameRepository.find({
      where: { userId: context.from?.id },
    });
    const currentGameNames = currentGames.map((game) => game.name);

    const newGames = games.filter((game) => !currentGameNames.includes(game));

    if (newGames.length === 0) {
      return context.sendMessage("Все эти игры уже есть в вашем списке.");
    }

    try {
      for (const gameName of newGames) {
        const game = new Game();
        game.name = gameName;
        game.userId = context.from!.id;
        game.steamId = await this.getSteamId(gameName);

        await gameRepository.save(game);
      }

      const message =
        newGames.length === 1
          ? `Игра успешно добавлена: ${newGames[0]}`
          : `Игры успешно добавлены: ${newGames.join(", ")}`;

      return context.sendMessage(message);
    } catch (error) {
      console.error("Ошибка при сохранении игр:", error);
      return context.sendMessage("Произошла ошибка при добавлении игры.");
    }
  }

  private async getSteamId(gameName: string): Promise<string> {
    const parserCommand = new ParserCommand(this.bot);

    const url = parserCommand.handleFormatUrlSearch(gameName);
    const href = await this.fetchGameInfoSteam(url);

    if (!href) {
      throw new Error("Failed to fetch game data from Steam.");
    }

    return this.formatSteamId(href);
  }

  async fetchGameInfoSteam(gameUrl: string): Promise<string | null> {
    try {
      const { data } = await axios.get(
        `https://store.steampowered.com/search/?term=${gameUrl}&ndl=1`
      );
      return this.parseSteamIdData(data);
    } catch (error) {
      console.error("Ошибка при получении данных с Steam:", error);
      return null;
    }
  }

  private parseSteamIdData(data: string): string | null {
    try {
      const dom = new JSDOM(data);
      const gameBlock = dom.window.document
        .getElementById("search_resultsRows")
        ?.querySelector("a");

      if (!gameBlock) return null;

      return gameBlock.href;
    } catch (error) {
      console.error("Ошибка при разборе данных Steam:", error);
      return null;
    }
  }

  private formatSteamId(url: string): string {
    const steamId = url.split("/")[4];

    console.log("SteamId:", steamId);

    return steamId;
  }
}

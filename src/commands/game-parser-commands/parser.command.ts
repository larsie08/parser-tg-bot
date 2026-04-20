import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import { JSDOM } from "jsdom";

import { GameMetaService, GameService, UserService } from "../../services";
import { notifyUserAboutError, timeoutDeleteMessage } from "../../utils";

import { Command, IBotContext, IGameSteamData } from "../../context";
import { Game } from "../../entities";

export class ParserCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
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

    const user = await new UserService().getUserWithGames(context.from.id);
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

    const game = await new GameService().getUserGame(
      context.session.parserSelectedGame,
    );

    if (!game) throw new Error("Не удалось найти игру в базе данных.");

    const gameData = await this.fetchGameInfoSteam(game.steamId);

    if (!gameData) {
      return notifyUserAboutError(
        context,
        "Не удалось получить данные о цене игры.",
      );
    }

    await this.updateGameInfo(gameData, game);

    await context
      .sendMessage(this.createGameMessage(gameData))
      .then((message) =>
        context.session.messagesId.gameParserMessageId.push(message.message_id),
      );
  }

  async fetchGameInfoSteam(gameId: string): Promise<IGameSteamData | null> {
    try {
      const { data } = await axios.get(
        `https://store.steampowered.com/app/${gameId}`,
      );
      return this.parseSteamData(data);
    } catch (error) {
      console.error("Ошибка при получении данных с Steam:", error);
      return null;
    }
  }

  private parseSteamData(data: string): IGameSteamData | null {
    try {
      const dom = new JSDOM(data);
      const gameArea = dom.window.document.getElementById("game_area_purchase");

      if (!gameArea) return null;

      const nameElement = dom.window.document.getElementById("appHubAppName");
      const priceElement = gameArea?.getElementsByClassName(
        "game_purchase_price",
      )[0];
      const discountPriceElement = gameArea.getElementsByClassName(
        "discount_final_price",
      )[0];
      const oldPriceElement = gameArea.getElementsByClassName(
        "discount_original_price",
      )[0];
      const discountElement =
        gameArea.getElementsByClassName("discount_pct")[0];
      const hrefElement = dom.window.document
        .getElementsByClassName("blockbg")[0]
        .querySelectorAll("a");
      const releaseDateElement = dom.window.document
        .getElementById("game_area_purchase")
        ?.getElementsByClassName("game_area_comingsoon")[0];

      const name = nameElement?.textContent || "Название недоступно";
      const price =
        priceElement?.textContent?.trim() ||
        discountPriceElement?.textContent?.trim();

      const oldPrice = oldPriceElement?.textContent;
      const discount = discountElement?.textContent;
      const href = hrefElement[hrefElement.length - 1].href;
      const releaseDate = releaseDateElement
        ?.querySelector("h1")
        ?.querySelector("span")
        ?.textContent?.trim();
      const releaseTime = releaseDateElement
        ?.querySelector("p")
        ?.textContent?.trim();

      return {
        name,
        price,
        oldPrice,
        discount,
        href,
        releaseDate,
        releaseTime,
      };
    } catch (error) {
      console.error("Ошибка при разборе данных Steam:", error);
      return null;
    }
  }

  createGameMessage(
    gameData: IGameSteamData,
    diff?: Partial<IGameSteamData>,
  ): string {
    const messageParts: string[] = [`🎮 *Название:* ${gameData.name}`];

    if ("sales" in gameData && gameData.sales) {
      messageParts.push(
        `💰 *Цена:* ${gameData.price}`,
        `📊 *Продаж:* ${gameData.sales}`,
      );
    } else if (gameData.releaseDate) {
      messageParts.push(`📅 *Дата выхода:* ${gameData.releaseDate}`);
      if (gameData.releaseTime) {
        messageParts.push(`⏰ *Время выхода:* ${gameData.releaseTime}`);
      }
    } else if (gameData.oldPrice && gameData.discount) {
      messageParts.push(
        `💸 *Старая цена:* ${gameData.oldPrice}`,
        `💰 *Новая цена:* ${gameData.price}`,
        `🔥 *Скидка:* ${gameData.discount}`,
      );
    } else {
      messageParts.push(`💰 *Цена:* ${gameData.price}`);
    }

    messageParts.push(`🔗 [Ссылка](${gameData.href})`);

    const changedFields = Object.keys(diff ?? {});

    let prefix = "";

    if (changedFields.includes("price") || changedFields.includes("oldPrice")) {
      prefix = "🔔 *Изменение цены!*\n";
    } else if (changedFields.includes("releaseDate")) {
      prefix = "📅 *Изменение даты выхода!*\n";
    } else if (changedFields.includes("releaseTime")) {
      prefix = "⏰ *Изменение времени выхода!*\n";
    }

    return prefix + messageParts.join("\n");
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

    return await new GameMetaService().upsertMetaInfo(gameData, game);
  }

  handleFormatUrlSearch(game: string): string {
    return encodeURIComponent(game);
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

import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import { JSDOM } from "jsdom";

import { Command } from "../command.class";

import { AppDataSource } from "../../config/typeOrm.config";

import { Game, User } from "../../entities";
import { IBotContext, IGameSteamData } from "../../context";

export class ParserCommand extends Command {
  private messagesId: number[] = [];
  private selectedGame = "";
  private isCheckingPrice = false;

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("check_price", async (context) => {
      await this.handleGameSelection(context);
    });
  }

  private async handleGameSelection(context: IBotContext): Promise<void> {
    if (!context.from) {
      context.sendMessage("Ошибка: не удалось определить пользователя.");
      return;
    }

    const user = await this.handleUserGames(context.from.id);
    const games = user?.games;

    if (!games?.length) {
      context.sendMessage("В списке отслеживаемого ничего не найдено");
      return;
    }

    this.isCheckingPrice = true;
    for (const game of games) {
      const message = await context.reply(
        game.name,
        Markup.inlineKeyboard([
          Markup.button.callback("Узнать цену", "check__game_price"),
        ]),
      );
      this.messagesId.push(message.message_id);
    }

    this.bot.action("check__game_price", async (context) => {
      await this.handlePriceCheck(context);
    });
  }

  private async handlePriceCheck(context: IBotContext): Promise<void> {
    if (!this.isCheckingPrice) return;

    const contextMessage = context.callbackQuery?.message;

    if (contextMessage && "text" in contextMessage) {
      this.selectedGame = contextMessage.text;
    }

    if (!this.selectedGame) {
      context.sendMessage("Ошибка при выборе игры.");
      return;
    }

    const message = await context.sendMessage(
      "Выберите ресурс",
      Markup.keyboard(["Steam", "Отменить"]),
    );
    this.messagesId.push(message.message_id);

    this.bot.hears("Steam", async () => await this.handleSteamPrice(context));
    this.bot.hears("Отменить", () => this.cancelOperation(context));
  }

  async handleUserGames(userId: number | undefined): Promise<User | null> {
    if (!userId) {
      console.log("Не удалось определить пользователя");
      return null;
    }

    return AppDataSource.getRepository(User).findOne({
      where: { userId },
      relations: { games: true },
    });
  }

  private async handleSteamPrice(context: IBotContext): Promise<void> {
    if (!this.isCheckingPrice) return;

    const gameRepository = AppDataSource.getRepository(Game);
    const gameId = await gameRepository
      .findOne({
        where: { name: this.selectedGame },
      })
      .then((game) => game?.steamId || "");

    const gameData = await this.fetchGameInfoSteam(gameId);
    if (!gameData) {
      context.sendMessage("Не удалось получить данные о цене игры.");
      return;
    }

    const message = await context.sendMessage(this.createGameMessage(gameData));
    this.messagesId.push(message.message_id);
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
        discountPriceElement?.textContent?.trim() ||
        "Цена недоступна";
      const oldPrice = oldPriceElement?.textContent || null;
      const discount = discountElement?.textContent || null;
      const href = hrefElement[hrefElement.length - 1].href;
      const releaseDate =
        releaseDateElement
          ?.querySelector("h1")
          ?.querySelector("span")
          ?.textContent?.trim() || null;
      const releaseTime =
        releaseDateElement?.querySelector("p")?.textContent?.trim() || null;

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
    isPriceChanged?: boolean,
    isReleaseDateChanged?: boolean,
    isReleaseTimeChanged?: boolean,
  ): string {
    const messageParts: string[] = [`🎮 *Название:* ${gameData.name}`];

    if ("sales" in gameData && gameData.sales) {
      messageParts.push(
        `💰 *Цена:* ${gameData.price}`,
        `📊 *Продаж:* ${gameData.sales}`,
      );
    } else if ("releaseDate" in gameData && gameData.releaseDate) {
      messageParts.push(`📅 *Дата выхода:* ${gameData.releaseDate}`);
      if (gameData.releaseTime)
        messageParts.push(`⏰ *Время выхода:* ${gameData.releaseTime}`);
    } else if (
      "discount" in gameData &&
      gameData.oldPrice &&
      gameData.discount
    ) {
      messageParts.push(
        `💸 *Старая цена:* ${gameData.oldPrice}`,
        `💰 *Новая цена:* ${gameData.price}`,
        `🔥 *Скидка:* ${gameData.discount}`,
      );
    } else {
      messageParts.push(`💰 *Цена:* ${gameData.price}`);
    }

    messageParts.push(`🔗 [Ссылка](${gameData.href})`);

    let prefix = "";
    if (isPriceChanged) {
      prefix = "🔔 *Изменение цены!*\n";
    } else if (isReleaseDateChanged) {
      prefix = "📅 *Изменение даты выхода!*\n";
    } else if (isReleaseTimeChanged) {
      prefix = "⏰ *Изменение времени выхода!*\n";
    }

    return prefix + messageParts.join("\n");
  }

  handleFormatUrlSearch(game: string): string {
    return encodeURIComponent(game);
  }

  private cancelOperation(context: IBotContext): void {
    context.deleteMessages(this.messagesId);
    this.isCheckingPrice = false;
  }
}

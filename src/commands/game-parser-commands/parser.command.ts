import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import { JSDOM } from "jsdom";

import { Command } from "../command.class";

import { IBotContext } from "../../context/context.interface";
import { AppDataSource } from "../../config/typeOrm.config";

import { Game } from "../../entities";
import { IGameMarketData, IGameSteamData } from "./game.interface";

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

    const games = await this.handleUserGames(context.from.id);
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
        ])
      );
      this.messagesId.push(message.message_id);
    }

    this.bot.action("check__game_price", async (context) => {
      await this.handlePriceCheck(context);
    });
  }

  private async handlePriceCheck(context: IBotContext): Promise<void> {
    if (!this.isCheckingPrice) return;

    // @ts-ignore
    this.selectedGame = context.callbackQuery.message?.text;

    if (!this.selectedGame) {
      context.sendMessage("Ошибка при выборе игры.");
      return;
    }

    const gameUrl = this.handleFormatUrlSearch(this.selectedGame);

    const message = await context.sendMessage(
      "Выберите ресурс",
      Markup.keyboard(["Plati.ru", "Steam", "Отменить"])
    );
    this.messagesId.push(message.message_id);

    this.bot.hears(
      "Plati.ru",
      async () => await this.handlePlatiPrice(context, gameUrl)
    );
    this.bot.hears("Steam", async () => await this.handleSteamPrice(context));
    this.bot.hears("Отменить", () => this.cancelOperation(context));
  }

  async handleUserGames(userId: number | undefined): Promise<Game[] | null> {
    if (!userId) {
      console.log("Не удалось определить пользователя");
      return null;
    }

    return AppDataSource.getRepository(Game).find({ where: { userId } });
  }

  private async handlePlatiPrice(
    context: IBotContext,
    gameUrl: string
  ): Promise<void> {
    if (!this.isCheckingPrice) return;

    const gameData = await this.fetchGameInfoPlatiMarket(gameUrl);
    if (!gameData?.length) {
      context.sendMessage("Не удалось получить данные о цене игры.");
      return;
    }

    const filteredGames = this.filterPlatiMarketGame(gameData);
    for (const item of filteredGames) {
      const message = await context.sendMessage(this.createGameMessage(item));
      this.messagesId.push(message.message_id);
    }
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

  async fetchGameInfoPlatiMarket(
    gameUrl: string
  ): Promise<IGameMarketData[] | null> {
    try {
      const { data } = await axios.get(
        `https://plati.market/search/${gameUrl}`
      );
      return this.parsePlatiMarketData(data);
    } catch (error) {
      console.error("Ошибка при получении данных с Plati.ru:", error);
      return null;
    }
  }

  async fetchGameInfoSteam(gameId: string): Promise<IGameSteamData | null> {
    try {
      const { data } = await axios.get(
        `https://store.steampowered.com/app/${gameId}`
      );
      return this.parseSteamData(data);
    } catch (error) {
      console.error("Ошибка при получении данных с Steam:", error);
      return null;
    }
  }

  private parsePlatiMarketData(data: string): IGameMarketData[] {
    const dom = new JSDOM(data);
    return [...dom.window.document.getElementsByClassName("shadow")].map(
      (item) => {
        const title = item.querySelector("h1");
        return {
          name: title?.querySelector("a")?.textContent || "Название недоступно",
          price: title?.querySelector("span")?.textContent || "Цена недоступна",
          sales:
            item
              ?.querySelector("ol")
              ?.querySelectorAll("li")[1]
              ?.querySelector("strong")?.textContent ||
            "Количество продаж неизвестно",
          href: "https://plati.market" + title?.querySelector("a")?.href,
        };
      }
    );
  }

  private parseSteamData(data: string): IGameSteamData | null {
    try {
      const dom = new JSDOM(data);
      const gameArea = dom.window.document.getElementById("game_area_purchase");

      if (!gameArea) return null;

      const nameElement = dom.window.document.getElementById("appHubAppName");
      const priceElement = gameArea?.getElementsByClassName(
        "game_purchase_price"
      )[0];
      const discountPriceElement = gameArea.getElementsByClassName(
        "discount_final_price"
      )[0];
      const oldPriceElement = gameArea.getElementsByClassName(
        "discount_original_price"
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

  private filterPlatiMarketGame(games: IGameMarketData[]): IGameMarketData[] {
    const gamesWithSales = games.filter((game) => Number(game.sales) !== 0);

    const toCheck = [
      "account",
      "аккаунт",
      "акк",
      "аренда",
      "rent",
      "dlc",
      "дополнение",
    ];

    const filteredGames = gamesWithSales.filter((game) => {
      const gameName = game.name.toLowerCase();
      const isSteamAccount = toCheck.some((word) => gameName.includes(word));

      return !isSteamAccount;
    });

    return filteredGames;
  }

  createGameMessage(
    gameData: IGameSteamData | IGameMarketData,
    isPriceChanged?: boolean,
    isReleaseDateChanged?: boolean,
    isReleaseTimeChanged?: boolean
  ): string {
    const messageParts: string[] = [`🎮 *Название:* ${gameData.name}`];

    if ("sales" in gameData && gameData.sales) {
      messageParts.push(
        `💰 *Цена:* ${gameData.price}`,
        `📊 *Продаж:* ${gameData.sales}`
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
        `🔥 *Скидка:* ${gameData.discount}`
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

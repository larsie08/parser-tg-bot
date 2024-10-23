import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import { JSDOM } from "jsdom";

import { Command } from "../command.class";

import { IBotContext } from "../../context/context.interface";
import { AppDataSource } from "../../config/typeOrm.config";

import { Game } from "../../entities";
import { IGameMarketData, IGameSteamData } from "./game.interface";

export class ParserCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    const messagesId: number[] = [];
    let selectedGame = "";
    let gameUrl = "";
    let isCheckingPrice = false;

    this.bot.action("check_price", async (context) => {
      const games = await this.handleUserGames(context.from.id);

      if (!games || games.length === 0)
        return context.sendMessage("В списке отслеживаемого ничего не найдено");

      isCheckingPrice = true;

      for (let i = 0; i < games.length; i++) {
        context
          .sendMessage(
            games[i].name,
            Markup.inlineKeyboard([
              Markup.button.callback("Узнать цену", "check__game_price"),
            ])
          )
          .then((message) => messagesId.push(message.message_id));
      }

      this.bot.action("check__game_price", async (context) => {
        if (!isCheckingPrice) return;

        // @ts-ignore
        selectedGame = context.callbackQuery.message?.text;
        if (!selectedGame) {
          return context.sendMessage("Ошибка при выборе игры.");
        }

        gameUrl = this.handleFormatUrlSearch(selectedGame);

        context
          .sendMessage(
            "Выберите ресурс",
            Markup.keyboard(["Plati.ru", "Steam", "Отменить"])
          )
          .then((message) => messagesId.push(message.message_id));

        this.bot.hears("Plati.ru", async () => {
          if (!isCheckingPrice) return;

          const gameData = await this.fetchGameInfoPlatiMarket(gameUrl);

          if (!gameData || gameData.length === 0) {
            return context.sendMessage(
              "Не удалось получить данные о цене игры."
            );
          }

          gameData.forEach((item) =>
            context
              .sendMessage(
                `Название: ${item.name}\nЦена: ${item.price}\nПродаж: ${item.sales}\nСсылка: ${item.href}`
              )
              .then((message) => messagesId.push(message.message_id))
          );
        });

        this.bot.hears("Steam", async () => {
          if (!isCheckingPrice) return;

          const gameData = await this.fetchGameInfoSteam(gameUrl);

          if (!gameData) {
            return context
              .sendMessage("Не удалось получить данные о цене игры.")
              .then((message) => messagesId.push(message.message_id));
          }

          let messageText = `Название: ${gameData.name}\nЦена: ${gameData.price}\nСсылка: ${gameData.href}`;

          if (gameData.oldPrice || gameData.discount) {
            messageText = `Название: ${gameData.name}\nСтарая цена: ${gameData.oldPrice}\nЦена: ${gameData.price}\nСкидка: ${gameData.discount}\nСсылка: ${gameData.href}`;
          }

          context
            .sendMessage(messageText)
            .then((message) => messagesId.push(message.message_id));
        });

        this.bot.hears("Отменить", (context) => {
          context.deleteMessages(messagesId);
          isCheckingPrice = false;
        });
      });
    });
  }

  async handleUserGames(userId: number): Promise<Game[] | null> {
    const gameRepository = AppDataSource.getRepository(Game);

    if (!userId) {
      console.log("Не удалось определить пользователя");
      return null;
    }
    const currentGames = gameRepository.find({
      where: { userId: userId },
    });
    return currentGames;
  }

  async fetchGameInfoPlatiMarket(gameUrl: string) {
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

  private parsePlatiMarketData(data: string): IGameMarketData[] {
    const gameInfo = [];
    const dom = new JSDOM(data);
    const items = dom.window.document.getElementsByClassName("shadow");

    for (let i = 0; i < items.length; i++) {
      const title = items[i].querySelector("h1");
      const nameElement = title?.querySelector("a");
      const priceElement = title?.querySelector("span");
      const salesElement = items[i]
        ?.querySelector("ol")
        ?.querySelectorAll("li")[1]
        ?.querySelector("strong");
      const href = "https://plati.market" + title?.querySelector("a")?.href;

      const name = nameElement?.textContent || "Название недоступно";
      const price = priceElement?.textContent || "Цена недоступна";
      const sales = salesElement?.textContent || "Количество продаж неизвестно";

      gameInfo.push({ name, price, sales, href });
    }

    return gameInfo;
  }

  async fetchGameInfoSteam(gameUrl: string) {
    try {
      const { data } = await axios.get(
        `https://store.steampowered.com/search/?term=${gameUrl}&ndl=1`
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
      const items = dom.window.document.getElementById("search_resultsRows");
      const gameBlock = items?.querySelector("a");

      if (!gameBlock) return null;

      const nameElement = gameBlock
        .getElementsByClassName("search_name")[0]
        ?.querySelector("span");
      const priceElement = gameBlock
        .getElementsByClassName("search_price_discount_combined")[0]
        ?.getElementsByClassName("discount_final_price")[0];
      const oldPriceElement = gameBlock
        .getElementsByClassName("search_price_discount_combined")[0]
        ?.getElementsByClassName("discount_original_price")[0];
      const discountElement = gameBlock
        .getElementsByClassName("search_price_discount_combined")[0]
        ?.getElementsByClassName("discount_pct")[0];

      const name = nameElement?.textContent || "Название недоступно";
      const price = priceElement?.textContent || "Цена недоступна";
      const oldPrice = oldPriceElement?.textContent || null;
      const discount = discountElement?.textContent || null;
      const href = gameBlock.href;

      return {
        name,
        price,
        oldPrice,
        discount,
        href,
      };
    } catch (error) {
      console.error("Ошибка при разборе данных Steam:", error);
      return null;
    }
  }

  handleFormatUrlSearch(game: string): string {
    return encodeURIComponent(game);
  }
}

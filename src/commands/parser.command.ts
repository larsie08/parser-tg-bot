import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import { JSDOM } from "jsdom";

import { Command } from "./command.class";

import { IBotContext } from "../context/context.interface";

export class ParserCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    const messagesId: number[] = [];

    this.bot.action("check_price", async (context) => {
      if (!context.session.games) {
        return context.sendMessage("В списке отслеживаемого ничего не найдено");
      }

      for (let i = 0; i < context.session.games.length; i++) {
        context
          .sendMessage(
            context.session.games[i],
            Markup.inlineKeyboard([
              Markup.button.callback("Узнать цену", "check__game_price"),
            ])
          )
          .then((message) => messagesId.push(message.message_id));
      }
    });

    this.bot.action("check__game_price", async (context) => {
      context
        .sendMessage(
          "Выберите ресурс",
          Markup.keyboard([
            Markup.button.callback("Plati.ru", "get_plati_market"),
            Markup.button.callback("Steam", "get_steam"),
            Markup.button.callback("Отменить", "cancel"),
          ])
        )
        .then((message) => messagesId.push(message.message_id));

      this.bot.hears("Plati.ru", async () => {
        //@ts-ignore
        const selectedGame = context.callbackQuery.message?.text;
        const gameUrl = this.handleFormatUrlSearch(selectedGame);

        const gameData = await this.fetchGameInfoPlatiMarket(gameUrl);

        if (!gameData || gameData.length === 0) {
          return context.sendMessage("Не удалось получить данные о цене игры.");
        }

        for (let i = 0; i < gameData.length; i++) {
          context
            .sendMessage(
              `Название: ${gameData[i].name}\nЦена: ${gameData[i].price}\nПродаж: ${gameData[i].sales}\nСсылка: ${gameData[i].href}`
            )
            .then((message) => messagesId.push(message.message_id));
        }
      });

      this.bot.hears("Steam", async () => {
        //@ts-ignore
        const selectedGame = context.callbackQuery.message?.text;
        const gameUrl = this.handleFormatUrlSearch(selectedGame);

        const gameData = await this.fetchGameInfoSteam(gameUrl);

        if (!gameData) {
          return context
            .sendMessage("Не удалось получить данные о цене игры.")
            .then((message) => messagesId.push(message.message_id));
        }

        context
          .sendMessage(
            `Название: ${gameData.name}\nЦена: ${gameData.price}\nСсылка: ${gameData.href}`
          )
          .then((message) => messagesId.push(message.message_id));
      });

      this.bot.hears("Отменить", (context) => {
        context.deleteMessages(messagesId);
      });
    });
  }

  async fetchGameInfoPlatiMarket(gameUrl: string) {
    try {
      const { data } = await axios.get(
        `https://plati.market/search/${gameUrl}`
      );
      const dom = new JSDOM(data);
      const gameInfo = [];
      const items = dom.window.document.getElementsByClassName("shadow");

      for (let i = 0; i < items.length; i++) {
        const title = items[i].querySelector("h1");

        const name = title?.querySelector("a")?.textContent;
        const price = title?.querySelector("span")?.textContent;
        const sales = items[i]
          ?.querySelector("ol")
          ?.querySelectorAll("li")[1]
          .querySelector("strong")?.textContent;

        const href = "https://plati.market" + title?.querySelector("a")?.href;

        gameInfo.push({ name, price, sales, href });
      }

      return gameInfo;
    } catch (error) {
      console.log(error);
    }
  }

  async fetchGameInfoSteam(gameUrl: string) {
    try {
      const { data } = await axios.get(
        `https://store.steampowered.com/search/?term=${gameUrl}&ndl=1`
      );
      const dom = new JSDOM(data);

      const items = dom.window.document.getElementById("search_resultsRows");
      const gameBlock = items?.querySelector("a");

      const name = gameBlock
        ?.getElementsByClassName("search_name")[0]
        .querySelector("span")?.textContent;
      const price = gameBlock?.getElementsByClassName("discount_final_price")[0]
        ?.textContent;
      const href = gameBlock?.href;

      return { name, price, href };
    } catch (error) {
      console.log(error);
    }
  }

  handleFormatUrlSearch(game: string) {
    return game.split(" ").join("%20");
  }
}

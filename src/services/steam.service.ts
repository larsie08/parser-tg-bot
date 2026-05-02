import axios from "axios";
import { JSDOM } from "jsdom";

import { GameNewsInfo, IGameSteamData } from "../context";

export class SteamService {
  async fetchGameIdSteam(
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

  async fetchGameNews(gameId: string): Promise<GameNewsInfo | null> {
    try {
      const { data } = await axios.get(
        `http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${gameId}&count=3&maxlength=300&format=json`,
      );
      return data;
    } catch (error) {
      console.error("Ошибка при запросе новостей Steam:", error);
      return null;
    }
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
}

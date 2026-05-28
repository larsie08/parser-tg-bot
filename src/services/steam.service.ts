import axios from "axios";
import { JSDOM } from "jsdom";

import {
  GameNewsInfo,
  IGameSteamData,
  SteamAppDetailsResponse,
} from "../context";

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

  async fetchGameMetaInfoRegionalSteam(
    gameId: string,
  ): Promise<IGameSteamData | null> {
    try {
      const { data } = await axios.get<SteamAppDetailsResponse>(
        `https://store.steampowered.com/api/appdetails?appids=${gameId}&cc=ru&l=en`,
        {
          headers: { Cookie: "birthtime=568022401; lastagecheckage=1-0-1990;" },
        },
      );
      return this.parseSteamPriceJsonData(data, gameId);
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

  private parseSteamPriceJsonData(
    data: SteamAppDetailsResponse,
    gameId: string,
  ): IGameSteamData | null {
    return {
      name: data[gameId].data.name,
      price: data[gameId].data.price_overview?.final_formatted,
      oldPrice:
        data[gameId].data.price_overview?.initial_formatted !==
        data[gameId].data.price_overview?.final_formatted
          ? data[gameId].data.price_overview?.initial_formatted
          : undefined,
      discount: data[gameId].data.price_overview?.discount_percent.toString(),
      releaseDate: data[gameId].data.release_date.date,
      releaseTime: undefined,
      comingSoon: data[gameId].data.release_date.coming_soon,
    };
  }
}

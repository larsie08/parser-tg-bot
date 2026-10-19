import axios from "axios";
import { JSDOM } from "jsdom";

import {
  headersResponse,
  ReleaseDateDataResponse,
  SteamAppDetailsResponse,
} from "./steam.types";
import { GameNewsInfo, IGameSteamData } from "../../modules";

export class SteamService {
  async fetchGameIdSteam(
    gameName: string,
  ): Promise<{ href: string; name: string } | null> {
    try {
      const { data } = await axios.get<Buffer<ArrayBufferLike>>(
        `https://store.steampowered.com/search/?term=${gameName}&ignore_preferences=1`,
      );
      return this.parseSteamIdData(data);
    } catch (error) {
      throw new Error("Ошибка при получении данных о steamId");
    }
  }

  async fetchEarlyAccessReleaseDate(
    gameId: string,
  ): Promise<ReleaseDateDataResponse | null> {
    try {
      const { data } = await axios.get<Buffer<ArrayBufferLike>>(
        `https://store.steampowered.com/app/${gameId}`,
        headersResponse,
      );
      return this.parseEarlyAccessReleaseDateData(data);
    } catch (error) {
      throw new Error("Ошибка при получении данных о раннем доступе");
    }
  }

  async fetchComingSoonReleaseDate(
    gameId: string,
  ): Promise<ReleaseDateDataResponse | null> {
    try {
      const { data } = await axios.get<Buffer<ArrayBufferLike>>(
        `https://store.steampowered.com/app/${gameId}`,
        headersResponse,
      );

      return this.parseComingSoonReleaseDateData(data);
    } catch (error) {
      throw new Error("Ошибка при получении данных о ближайшей дате релиза.");
    }
  }

  async fetchGameNews(gameId: string): Promise<GameNewsInfo | null> {
    try {
      const { data } = await axios.get<GameNewsInfo>(
        `http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${gameId}&count=15&maxlength=300&format=json`,
      );

      return this.parseAndFiltersRelevantSteamNews(data);
    } catch (error) {
      throw new Error("Ошибка при запросе новостей Steam");
    }
  }

  async fetchGameMetaInfoRegionalSteam(
    gameId: string,
  ): Promise<IGameSteamData | null> {
    try {
      for (const region of ["ru", "us", "en"]) {
        const data = await this.fetchAppDetails(gameId, region);

        const [responseKey, _response] = Object.entries(data)[0];

        if (data[responseKey].success) {
          return this.parseSteamPriceJsonData(data, responseKey);
        }
      }

      return null;
    } catch (error) {
      throw new Error("Ошибка при получении данных о цене");
    }
  }

  private async fetchAppDetails(
    gameId: string,
    countryCode: string,
  ): Promise<SteamAppDetailsResponse> {
    const { data } = await axios.get<SteamAppDetailsResponse>(
      `https://store.steampowered.com/api/appdetails?appids=${gameId}&cc=${countryCode}&l=en`,
      headersResponse,
    );

    return data;
  }

  private parseSteamIdData(
    data: Buffer<ArrayBufferLike>,
  ): { href: string; name: string } | null {
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
  }

  private parseSteamPriceJsonData(
    data: SteamAppDetailsResponse,
    gameId: string,
  ): IGameSteamData | null {
    return {
      name: data[gameId].data.name,
      price:
        data[gameId].data.price_overview &&
        data[gameId].data.price_overview?.final / 100,
      oldPrice:
        data[gameId].data.price_overview &&
        data[gameId].data.price_overview?.initial !==
          data[gameId].data.price_overview?.final
          ? data[gameId].data.price_overview?.initial / 100
          : undefined,
      currency: data[gameId].data.price_overview?.currency,
      discount: data[gameId].data.price_overview?.discount_percent.toString(),
      releaseDate: this.shouldSaveReleaseDate(data, gameId)
        ? data[gameId].data.release_date.date
        : undefined,
      comingSoon: data[gameId].data.release_date.coming_soon,
      isEarlyAccess:
        data[gameId].data.genres?.some(
          (obj) => obj.description === "Early Access",
        ) || false,
      dlc: data[gameId].data.dlc?.map((dlcId) => String(dlcId)),
    };
  }

  private parseEarlyAccessReleaseDateData(
    data: Buffer<ArrayBufferLike>,
  ): ReleaseDateDataResponse | null {
    const dom = new JSDOM(data);

    const infoBlock = dom.window.document.getElementsByClassName(
      "early_access_header",
    )[0];

    const releaseInfoBlock = infoBlock.getElementsByClassName(
      "leaving_early_access",
    )[0];

    const releaseDateText = releaseInfoBlock.querySelector("h2")?.textContent;
    const releaseTimeText =
      releaseInfoBlock.childNodes.length > 1
        ? releaseInfoBlock.querySelector("p")?.textContent
        : null;

    if (!releaseDateText) return null;

    const matchReleaseDate = releaseDateText.match(
      /Leaving Early Access:\s*([0-9]{1,2}\s+[A-Za-z]{3},\s+\d{4})/,
    );
    const matchTime = releaseTimeText?.match(
      /unlock in approximately (\d+)\s+hours?/i,
    );

    const hours = Number(matchTime?.[1]);

    const releaseTime = new Date(Date.now() + hours * 60 * 60 * 1000);

    return {
      releaseDate: matchReleaseDate?.[1] ?? null,
      releaseTime,
    };
  }

  private parseAndFiltersRelevantSteamNews(data: GameNewsInfo): GameNewsInfo {
    const newsItems = data.appnews.newsitems;

    const newsWithFeedType = newsItems.filter((item) => item.feed_type);

    return {
      appnews: {
        ...data.appnews,
        newsitems: newsWithFeedType,
      },
    };
  }

  private parseComingSoonReleaseDateData(
    data: Buffer<ArrayBufferLike>,
  ): ReleaseDateDataResponse | null {
    const dom = new JSDOM(data);

    const infoBlock = dom.window.document.getElementsByClassName(
      "game_area_comingsoon",
    )[0];
    const releaseDateBlock = infoBlock.querySelector("h1");

    if (!releaseDateBlock) return null;

    let releaseDateText =
      releaseDateBlock?.childNodes.length >= 1 &&
      releaseDateBlock.querySelector("span")?.textContent;
    if (!releaseDateText) releaseDateText = releaseDateBlock.textContent;

    const releaseTimeText =
      infoBlock.getElementsByClassName("content")[0].childNodes.length >= 1
        ? infoBlock.querySelector("p")?.textContent
        : null;

    const matchReleaseDate = releaseDateText?.match(
      /^(?:Coming\s+)?(\d{1,2}\s+[A-Za-z]{3},\s+\d{4})$/i,
    );
    const releaseDate = matchReleaseDate?.[1] ?? null;

    const matchTime = releaseTimeText?.match(
      /unlock in approximately (\d+)\s+hours?/i,
    );
    const hours = Number(matchTime?.[1]);
    const releaseTime = new Date(Date.now() + hours * 60 * 60 * 1000);

    return {
      releaseDate,
      releaseTime,
    };
  }

  private shouldSaveReleaseDate(
    data: SteamAppDetailsResponse,
    gameId: string,
  ): boolean {
    const { genres, release_date } = data[gameId].data;

    if (!genres) return false;

    const isEarlyAccess = genres.some(
      (genre) => genre.description === "Early Access",
    );

    if (isEarlyAccess) return false;
    if (!release_date.coming_soon) return false;

    const deniedDates = new Set(["coming soon", "to be announced"]); // по мере нахождения - увеличить

    return !deniedDates.has(release_date.date.toLowerCase());
  }
}

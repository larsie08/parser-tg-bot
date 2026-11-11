import axios from "axios";
import { JSDOM } from "jsdom";

import {
  GiveawayResolvedData,
  headersResponse,
  ReleaseDateDataResponse,
  SteamAppDetailsResponse,
} from "./steam.types";
import { Additions, Game, GameNewsInfo, IGameSteamData } from "../../modules";
import { TypeOfResponse } from "../../bot/jobs/jobs.types";

export class SteamService {
  async fetchGameIdSteam(
    gameName: string,
  ): Promise<{ href: string; name: string } | null> {
    try {
      const { data } = await axios.get<Buffer<ArrayBufferLike>>(
        `https://store.steampowered.com/search/?term=${gameName}&ignore_preferences=1`,
      );
      return this.parseSteamIdDOMData(data);
    } catch (error) {
      throw new Error("Ошибка при получении данных о steamId");
    }
  }

  async fetchReleaseDateAndTimeUntilRelease(
    gameId: string,
    type: TypeOfResponse,
  ): Promise<ReleaseDateDataResponse | null> {
    try {
      const { data } = await axios.get<Buffer<ArrayBufferLike>>(
        `https://store.steampowered.com/app/${gameId}`,
        headersResponse,
      );

      return this.parseReleaseDateDOMData(data, type);
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
        const { data } = await axios.get<SteamAppDetailsResponse>(
          `https://store.steampowered.com/api/appdetails?appids=${gameId}&cc=${region}&l=en`,
          headersResponse,
        );

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

  async fetchGamesSteamIdGiveaway(): Promise<GiveawayResolvedData[] | null> {
    try {
      const { data } = await axios.get<Buffer<ArrayBufferLike>>(
        `https://store.steampowered.com/search/?hwtype=0&maxprice=free&supportedlang=english&specials=1&hidef2p=1&ndl=1`,
      );

      return this.parseGiveawayDOMData(data);
    } catch (error) {
      throw new Error("Ошибка при получении данных о раздаче игр.");
    }
  }

  private parseSteamIdDOMData(
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
      type: data[gameId].data.type,
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
      fullgame: data[gameId].data.fullgame,
    };
  }

  private parseReleaseDateDOMData(
    data: Buffer<ArrayBufferLike>,
    type: TypeOfResponse,
  ): ReleaseDateDataResponse | null {
    const dom = new JSDOM(data);

    let releaseDateText: string | null;
    let releaseTimeText: string | null;

    switch (type) {
      case "comingSoon": {
        const infoBlock = dom.window.document.getElementsByClassName(
          "game_area_comingsoon",
        )[0];
        const releaseDateBlock = infoBlock.querySelector("h1");

        if (!releaseDateBlock) return null;

        releaseDateText =
          releaseDateBlock?.querySelector("span")?.textContent?.trim() ||
          releaseDateBlock?.textContent?.trim() ||
          null;

        releaseTimeText =
          infoBlock.querySelector(".content p")?.textContent?.trim() || null;

        break;
      }

      case "isEarlyAccess": {
        const infoBlock = dom.window.document.getElementsByClassName(
          "early_access_header",
        )[0];

        const releaseInfoBlock = infoBlock.getElementsByClassName(
          "leaving_early_access",
        )[0];

        releaseDateText =
          releaseInfoBlock.querySelector("h2")?.textContent || null;
        releaseTimeText =
          releaseInfoBlock.querySelector("p")?.textContent || null;

        break;
      }

      case "both": {
        const infoBlock = dom.window.document.getElementsByClassName(
          "game_area_comingsoon",
        )[0];
        const releaseDateBlock = infoBlock.querySelector("h1");

        if (!releaseDateBlock) return null;

        releaseDateText =
          releaseDateBlock?.querySelector("span")?.textContent?.trim() ||
          releaseDateBlock?.textContent?.trim() ||
          null;

        releaseTimeText =
          infoBlock.querySelector(".content p")?.textContent?.trim() || null;

        break;
      }

      default:
        return null;
    }

    if (!releaseDateText) return null;

    return this.parseReleaseDateInfo(releaseDateText, releaseTimeText, type);
  }

  private parseReleaseDateInfo(
    releaseDateText: string,
    releaseTimeText: string | null,
    type: TypeOfResponse,
  ): ReleaseDateDataResponse | null {
    let matchReleaseDate: RegExpMatchArray | null;

    switch (type) {
      case "comingSoon":
        matchReleaseDate = releaseDateText?.match(
          /^(?:Coming\s+)?(\d{1,2}\s+[A-Za-z]{3},\s+\d{4})$/i,
        );
        break;

      case "isEarlyAccess":
        matchReleaseDate = releaseDateText.match(
          /Leaving Early Access:\s*([0-9]{1,2}\s+[A-Za-z]{3},\s+\d{4})/,
        );
        break;

      case "both":
        matchReleaseDate = releaseDateText.match(
          /Planned Release Date:\s*([0-9]{1,2}\s+[A-Za-z]{3},\s+\d{4})/,
        );
        break;

      default: {
        return null;
      }
    }

    const matchTime = releaseTimeText?.match(
      /unlock in approximately (\d+)\s+hours?/i,
    );

    const hours = matchTime ? Number(matchTime[1]) : null;

    const releaseTime =
      hours !== null && Number.isFinite(hours)
        ? new Date(Date.now() + hours * 60 * 60 * 1000)
        : null;

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

  private parseGiveawayDOMData(
    data: Buffer<ArrayBufferLike>,
  ): GiveawayResolvedData[] | null {
    const dom = new JSDOM(data);

    const entitiesSearchBlock =
      dom.window.document.getElementById("search_resultsRows");

    if (!entitiesSearchBlock || !entitiesSearchBlock.childNodes.length)
      return null;

    const steamIds: GiveawayResolvedData[] = [];

    for (let i = 0; i < entitiesSearchBlock.querySelectorAll("a").length; i++) {
      const entityBlock = entitiesSearchBlock.querySelectorAll("a")[i];

      steamIds.push({
        steamId: entityBlock.href.split("/")[4],
        href: entityBlock.href,
      });
    }

    return steamIds;
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

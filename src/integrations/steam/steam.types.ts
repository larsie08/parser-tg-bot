export type SteamAppDetailsResponse = {
  [appId: string]: {
    success: boolean;
    data: SteamGameData;
  };
};

export type ReleaseDateDataResponse = {
  releaseDate: string | null;
  releaseTime: Date | null;
};

type SteamGameData = {
  type: "dlc" | "game";

  steam_appid: number;

  name: string;
  short_description: string;

  header_image: string;
  website: string;

  price_overview?: SteamPriceOverview;

  release_date: SteamReleaseDate;

  platforms: SteamPlatforms;

  dlc?: number[];

  genres?: SteamGenre[];

  fullgame?: SteamGameParent;

  recommendations?: {
    total: number;
  };
};

export type SteamGameParent = {
  appid: string;
  name: string;
};

type SteamPriceOverview = {
  currency: SteamCurrency;

  initial: number;
  final: number;

  initial_formatted: string;

  discount_percent: number;

  final_formatted: string;
};

type SteamReleaseDate = {
  coming_soon: boolean;
  date: string;
};

type SteamPlatforms = {
  windows: boolean;
  mac: boolean;
  linux: boolean;
};

type SteamGenre = {
  id: string;
  description: string;
};

type SteamCurrency = "RUB" | "USD" | "EUR";

export type GiveawayResolvedData = { steamId: string; href: string };

export const headersResponse = {
  headers: {
    Cookie: "birthtime=568022401; lastagecheckage=1-0-1990;",
  },
};

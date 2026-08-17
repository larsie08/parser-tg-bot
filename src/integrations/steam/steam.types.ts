export type SteamAppDetailsResponse = {
  [appId: string]: {
    success: boolean;
    data: SteamGameData;
  };
};

type SteamGameData = {
  steam_appid: number;

  name: string;
  short_description: string;

  header_image: string;
  website: string;

  price_overview?: SteamPriceOverview;

  release_date: SteamReleaseDate;

  platforms: SteamPlatforms;

  genres: SteamGenre[];

  recommendations?: {
    total: number;
  };
};

type SteamPriceOverview = {
  currency: string;

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

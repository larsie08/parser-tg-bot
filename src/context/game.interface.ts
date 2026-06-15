export interface IGameBaseData {
  name: string;
  price: string | undefined;
}

export interface IGameSteamData extends IGameBaseData {
  oldPrice: string | undefined;
  discount: string | undefined;
  releaseTime: string | undefined;
  releaseDate: string | undefined;
  comingSoon: boolean;
}

export interface IGameSteamInfo extends IGameSteamData {
  userId: number;
}

export interface SteamAppDetailsResponse {
  [appId: string]: {
    success: boolean;
    data: SteamGameData;
  };
}

export interface SteamGameData {
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
}

export interface SteamPriceOverview {
  currency: string;

  initial: number;
  final: number;

  initial_formatted: string;

  discount_percent: number;

  final_formatted: string;
}

export interface SteamReleaseDate {
  coming_soon: boolean;
  date: string;
}

export interface SteamPlatforms {
  windows: boolean;
  mac: boolean;
  linux: boolean;
}

export interface SteamGenre {
  id: string;
  description: string;
}

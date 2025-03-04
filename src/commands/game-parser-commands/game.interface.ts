export interface IGameBaseData {
  name: string;
  price: string;
  href: string;
}

export interface IGameSteamData extends IGameBaseData {
  oldPrice: string | null;
  discount: string | null;
  releaseTime: string | null;
  releaseDate: string | null;
}

export interface IGameMarketData extends IGameBaseData {
  sales?: string;
}

export interface IGameSteamInfo extends IGameSteamData {
  userId: number;
}

export interface IGameMarketInfo extends IGameMarketData {
  userId: number;
}

export type GameNewsInfo = {
  appnews: {
    appid: number;
    newsitems: NewsItem[];
  };
};

export type NewsItem = {
  gid: string;
  contents: string;
  title: string;
  url: string;
};

export interface IGameBaseData {
  name: string;
  price: string | undefined;
  href: string;
}

export interface IGameSteamData extends IGameBaseData {
  oldPrice: string | undefined;
  discount: string | undefined;
  releaseTime: string | undefined;
  releaseDate: string | undefined;
}

export interface IGameSteamInfo extends IGameSteamData {
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
  feed_type: number;
  feedname: string;
  feedlabel: string;
  tags: string[];
};

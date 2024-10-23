export interface IGameSteamData {
  name: string;
  price: string;
  oldPrice: string | null;
  discount: string | null;
  href: string;
}

export interface IGameMarketData {
  name: string;
  price: string;
  sales: string;
  href: string;
}

export interface IGameSteamInfo extends IGameSteamData {
  userId: number;
}

export interface IGameMarketInfo extends IGameMarketData {
  userId: number;
}

export interface IGameSteamData {
  name: string;
  price: number | undefined;
  oldPrice: number | undefined;
  discount: string | undefined;
  releaseDate: string | undefined;
  currency: string | undefined;
  comingSoon: boolean;
  isEarlyAccess: boolean;
  dlc?: string[];
}

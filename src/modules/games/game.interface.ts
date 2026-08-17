export interface IGameSteamData {
  name: string;
  price: string | undefined;
  oldPrice: string | undefined;
  discount: string | undefined;
  releaseDate: string | undefined;
  comingSoon: boolean;
  isEarlyAccess: boolean;
}

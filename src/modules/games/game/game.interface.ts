import { SteamGameParent } from "../../../integrations";

export interface IGameSteamData {
  type: "dlc" | "game";
  name: string;
  price: number | undefined;
  oldPrice: number | undefined;
  discount: string | undefined;
  releaseDate: string | undefined;
  currency: string | undefined;
  comingSoon: boolean;
  isEarlyAccess: boolean;
  dlc?: string[];
  fullgame?: SteamGameParent;
}

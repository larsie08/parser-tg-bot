import { GameMeta, GameMetaType, IGameSteamData } from "../../modules";
import { GAME } from "./games.data";

export const BASE_META: GameMeta = {
  id: 1,
  type: GameMetaType.GAME,
  game: GAME,
  addition: undefined,
  priceHistory: undefined,
  price: undefined,
  oldPrice: undefined,
  currency: undefined,
  discount: undefined,
  releaseDate: undefined,
  releaseTime: undefined,
  comingSoon: false,
  isEarlyAccess: false,
  lastSteamPageCheck: new Date("2026-09-22 00:31:36.98"),
  createdAt: new Date("2026-09-22 00:31:36.98"),
  updatedAt: new Date("2026-09-22 00:31:36.98"),
};

export const BASE_STEAMGAMEDATA: IGameSteamData = {
  name: GAME.name,
  releaseDate: undefined,
  currency: undefined,
  price: undefined,
  oldPrice: undefined,
  discount: undefined,
  comingSoon: false,
  isEarlyAccess: false,
  dlc: [],
};

export const BASE_EXPECTED_META_UPDATE_RESULT = {
  price: null,
  oldPrice: null,
  discount: null,
  comingSoon: false,
  releaseDate: null,
  isEarlyAccess: false,
  currency: null,
};

export const META_WITH_RELEASEDATE: GameMeta = {
  ...BASE_META,
  releaseDate: "Q4 2026",
  comingSoon: true,
};

export const META_WITH_PRICE: GameMeta = {
  ...BASE_META,
  price: 360,
  currency: "RUB",
};

export const STEAMGAMEDATA_META_WITH_RELEASEDATE_QUARTER_CHANGES: IGameSteamData =
  {
    ...BASE_STEAMGAMEDATA,
    comingSoon: true,
    releaseDate: "Q4 2026",
  };

export const STEAMGAMEDATA_META_RELEASED = {
  ...BASE_STEAMGAMEDATA,
  price: 240,
  oldPrice: 240,
  currency: "RUB",
};

export const STEAMGAMEDATA_META_WITH_MULTIPLE_CHANGES: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  price: 240,
  oldPrice: 370,
  discount: "10",
  comingSoon: true,
  releaseDate: "15 Oct, 2026",
  isEarlyAccess: true,
  currency: "RUB",
};

export const STEAMGAMEDATA_META_WITH_CURRENCY_CHANGES: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  currency: "USD",
  price: 12.0,
};

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
  createdAt: new Date("2026-09-22 00:31:36.98"),
  updatedAt: new Date("2026-09-22 00:31:36.98"),
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

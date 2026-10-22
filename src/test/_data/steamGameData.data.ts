import { IGameSteamData } from "../../modules";
import { getUpcomingReleaseDateForTest } from "../helpers/getUpcomingReleaseDate";
import { ADDITION, GAME } from "./games.data";

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

export const STEAMGAMEDATA_META_WITH_RELEASEDATE_QUARTER_CHANGES: IGameSteamData =
  {
    ...BASE_STEAMGAMEDATA,
    comingSoon: true,
    releaseDate: getUpcomingReleaseDateForTest("quarter"),
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
  releaseDate: getUpcomingReleaseDateForTest("date"),
  isEarlyAccess: true,
  currency: "RUB",
};

export const STEAMGAMEDATA_META_WITH_CURRENCY_CHANGES: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  currency: "USD",
  price: 12.0,
};

export const EMPTY_STEAMGAMEDATA_WITH_PRICE: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  price: 240.0,
  oldPrice: 360.0,
};

export const STEAMGAMEDATA_WITH_PRICE_RU_CHANGES: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  currency: "RUB",
  price: 899,
  discount: "0",
};

export const STEAMGAMEDATA_WITH_PRICE_USD_CHANGES: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  currency: "USD",
  price: 69.99,
  discount: "0",
};

export const STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  releaseDate: getUpcomingReleaseDateForTest("date"),
  comingSoon: true,
};

const STEAMGAMEDATA_WITH_EARLYRELEASEDATE_CHANGES: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  releaseDate: getUpcomingReleaseDateForTest("date"),
  isEarlyAccess: true,
};

export const STEAMGAMEDATA_WITH_RELEASEDATE_LIKE_YEAR_CHANGES: IGameSteamData =
  {
    ...BASE_STEAMGAMEDATA,
    releaseDate: getUpcomingReleaseDateForTest("year"),
  };

export const STEAMGAMEDATA_WITH_ADDITIONS_CHANGES: IGameSteamData = {
  ...BASE_STEAMGAMEDATA,
  dlc: ["5001840", "4024620", "4572870"],
};

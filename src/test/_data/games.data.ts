import { Additions, Game, GameMetaType, IGameSteamData } from "../../modules";

export const GAME: Game = {
  id: 1,
  name: "Crimson Desert Enhanced",
  steamId: "3321460",
  href: "https://store.steampowered.com/app/3321460/Crimson_Desert_Enhanced/",
  users: [],
  news: [],
  subscriptions: [],
  meta: {
    id: 1,
    type: GameMetaType.GAME,
    price: undefined,
    oldPrice: undefined,
    discount: undefined,
    comingSoon: false,
    isEarlyAccess: false,
    currency: undefined,
    createdAt: new Date("2026-09-14 15:31:20.356795"),
    updatedAt: new Date("2026-09-14 15:31:20.356795"),
  },
  additions: [],
  createdAt: new Date("2026-09-14 15:31:20.356795"),
  updatedAt: new Date("2026-09-14 15:31:20.356795"),
};

export const GAME_WITH_META_PRICE: Game = {
  ...GAME,
  meta: { ...GAME.meta, price: 240.00, oldPrice: 360.00 },
};

export const ADDITION: Additions = {
  id: 1,
  name: "Crimson Desert Enhanced: Charting the Unknown",
  steamId: "5001840",
  href: "https://store.steampowered.com/app/5001840/",
  game: GAME,
  meta: {
    id: 2,
    type: GameMetaType.ADDITION,
    price: undefined,
    oldPrice: undefined,
    discount: undefined,
    comingSoon: false,
    isEarlyAccess: false,
    currency: undefined,
    createdAt: new Date("2026-09-14 15:31:20.356795"),
    updatedAt: new Date("2026-09-14 15:31:20.356795"),
  },
  createdAt: new Date("2026-09-14 15:31:20.356795"),
  updatedAt: new Date("2026-09-14 15:31:20.356795"),
};

export const EMPTY_STEAMGAMEDATA: IGameSteamData = {
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

export const EMPTY_STEAMGAMEDATA_WITH_PRICE: IGameSteamData = {
  name: GAME.name,
  releaseDate: undefined,
  currency: undefined,
  price: 240.00,
  oldPrice: 360.00,
  discount: undefined,
  comingSoon: false,
  isEarlyAccess: false,
  dlc: [],
};

export const STEAMGAMEDATA_WITH_PRICE_RU_CHANGES: IGameSteamData = {
  name: GAME.name,
  releaseDate: undefined,
  currency: "RUB",
  price: 899,
  oldPrice: undefined,
  discount: "0",
  comingSoon: false,
  isEarlyAccess: false,
  dlc: [],
};

export const STEAMGAMEDATA_WITH_PRICE_USD_CHANGES: IGameSteamData = {
  name: GAME.name,
  releaseDate: undefined,
  currency: "USD",
  price: 69.99,
  oldPrice: undefined,
  discount: "0",
  comingSoon: false,
  isEarlyAccess: false,
  dlc: [],
};

export const STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES: IGameSteamData = {
  name: GAME.name,
  releaseDate: "15 Oct, 2026",
  currency: undefined,
  price: undefined,
  oldPrice: undefined,
  discount: undefined,
  comingSoon: true,
  isEarlyAccess: false,
  dlc: [],
};

export const STEAMGAMEDATA_WITH_EARLYRELEASEDATE_CHANGES: IGameSteamData = {
  name: GAME.name,
  releaseDate: "15 Oct, 2026",
  currency: undefined,
  price: undefined,
  oldPrice: undefined,
  discount: undefined,
  comingSoon: false,
  isEarlyAccess: true,
  dlc: [],
};

export const STEAMGAMEDATA_WITH_ADDITIONS_CHANGES: IGameSteamData = {
  name: GAME.name,
  releaseDate: undefined,
  currency: undefined,
  price: undefined,
  oldPrice: undefined,
  discount: undefined,
  comingSoon: false,
  isEarlyAccess: false,
  dlc: ["5001840", "4024620", "4572870"],
};

export const EMPTY_ADDITION_DATA: IGameSteamData = {
  name: ADDITION.name,
  releaseDate: undefined,
  currency: undefined,
  price: undefined,
  oldPrice: undefined,
  discount: undefined,
  comingSoon: false,
  isEarlyAccess: false,
};

export const ADDITIONDATA_WITH_PRICE_RU_CHANGES: IGameSteamData = {
  name: ADDITION.name,
  releaseDate: undefined,
  currency: "RUB",
  price: 1499,
  oldPrice: 1000,
  discount: "0",
  comingSoon: false,
  isEarlyAccess: false,
};

export const ADDITIONDATA_WITH_PRICE_USD_CHANGES: IGameSteamData = {
  name: ADDITION.name,
  releaseDate: undefined,
  currency: "USD",
  price: 32,
  oldPrice: 24,
  discount: "0",
  comingSoon: false,
  isEarlyAccess: false,
};

export const ADDITIONDATA_WITH_RELEASEDATE_CHANGES: IGameSteamData = {
  name: ADDITION.name,
  releaseDate: "15 Oct, 2026",
  currency: undefined,
  price: undefined,
  oldPrice: undefined,
  discount: undefined,
  comingSoon: true,
  isEarlyAccess: false,
};

export const ADDITIONDATA_WITH_EARLYRELEASEDATE_CHANGES: IGameSteamData = {
  name: ADDITION.name,
  releaseDate: "15 Oct, 2026",
  currency: undefined,
  price: undefined,
  oldPrice: undefined,
  discount: undefined,
  comingSoon: false,
  isEarlyAccess: true,
};

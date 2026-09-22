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
  meta: { ...GAME.meta, price: 240.0, oldPrice: 360.0 },
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


import { SteamAppDetailsResponse } from "../../integrations/steam/steam.types";
import { IGameSteamData } from "../../modules";

export const STEAM_APP_DETAILS_RESPONSE_RU: SteamAppDetailsResponse = {
  "3321460": {
    success: true,
    data: {
      name: "Crimson Desert Enhanced",
      steam_appid: 3321460,
      dlc: [5001840, 4024620, 4572870],
      price_overview: {
        currency: "RUB",
        initial: 429900,
        final: 429900,
        discount_percent: 0,
        initial_formatted: "",
        final_formatted: "4299 руб.",
      },
      genres: [
        { id: "1", description: "Action" },
        { id: "25", description: "Adventure" },
      ],
      release_date: { coming_soon: false, date: "19 Mar, 2026" },
      platforms: { windows: true, mac: true, linux: false },
      website: "https://crimsondesert.pearlabyss.com",
      header_image:
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/236f3814be7a97d86831800691b6096d449222a8/header.jpg?t=1789020763",
      short_description:
        "Crimson Desert is an open-world action-adventure set on the continent of Pywel. Join Kliff on his journey to rebuild the Greymane faction and to save the land from a looming threat. From vast wilderness and cities to ruins and the mysterious Abyss, forge your path through battles and discovery.",
    },
  },
};

export const STEAM_APP_DETAILS_RESPONSE_USD = {
  ...STEAM_APP_DETAILS_RESPONSE_RU,

  "3321460": {
    ...STEAM_APP_DETAILS_RESPONSE_RU["3321460"],

    data: {
      ...STEAM_APP_DETAILS_RESPONSE_RU["3321460"].data,

      price_overview: {
        currency: "USD",
        initial: 6999,
        final: 6999,
        discount_percent: 0,
        initial_formatted: "",
        final_formatted: "$69.99",
      },
    },
  },
};

export const STEAM_APP_DETAILS_RESPONSE_EUR: SteamAppDetailsResponse = {
  ...STEAM_APP_DETAILS_RESPONSE_RU,

  "3321460": {
    ...STEAM_APP_DETAILS_RESPONSE_RU["3321460"],

    data: {
      ...STEAM_APP_DETAILS_RESPONSE_RU["3321460"].data,

      price_overview: {
        currency: "EUR",
        initial: 6999,
        final: 6999,
        discount_percent: 0,
        initial_formatted: "",
        final_formatted: "$69.99",
      },
    },
  },
};

export const EXPECTED_STEAM_APP_DETAILS_RU: IGameSteamData = {
  name: "Crimson Desert Enhanced",
  releaseDate: undefined,
  currency: "RUB",
  price: 4299,
  oldPrice: undefined,
  discount: "0",
  comingSoon: false,
  isEarlyAccess: false,
  dlc: ["5001840", "4024620", "4572870"],
};

export const EXPECTED_STEAM_APP_DETAILS_USD: IGameSteamData = {
  name: "Crimson Desert Enhanced",
  releaseDate: undefined,
  currency: "USD",
  price: 69.99,
  oldPrice: undefined,
  discount: "0",
  comingSoon: false,
  isEarlyAccess: false,
  dlc: ["5001840", "4024620", "4572870"],
};

export const EXPECTED_STEAM_APP_DETAILS_EUR: IGameSteamData = {
  name: "Crimson Desert Enhanced",
  releaseDate: undefined,
  currency: "EUR",
  price: 69.99,
  oldPrice: undefined,
  discount: "0",
  comingSoon: false,
  isEarlyAccess: false,
  dlc: ["5001840", "4024620", "4572870"],
};

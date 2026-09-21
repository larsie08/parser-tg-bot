import { describe, expect, it } from "@jest/globals";

import { getDiffData } from "../../modules";
import {
  EMPTY_STEAMGAMEDATA,
  EMPTY_STEAMGAMEDATA_WITH_PRICE,
  GAME,
  GAME_WITH_META_PRICE,
  STEAMGAMEDATA_WITH_ADDITIONS_CHANGES,
  STEAMGAMEDATA_WITH_EARLYRELEASEDATE_CHANGES,
  STEAMGAMEDATA_WITH_PRICE_RU_CHANGES,
  STEAMGAMEDATA_WITH_PRICE_USD_CHANGES,
  STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES,
} from "../_data";

describe("getDiffData", () => {
  it("detects price change", () => {
    expect(getDiffData(GAME, STEAMGAMEDATA_WITH_PRICE_RU_CHANGES)).toEqual({
      price: 899,
      discount: "0",
      currency: "RUB",
    });
    expect(getDiffData(GAME, STEAMGAMEDATA_WITH_PRICE_USD_CHANGES)).toEqual({
      price: 69.99,
      discount: "0",
      currency: "USD",
    });
  });
  it("detects release date change", () => {
    expect(getDiffData(GAME, STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES)).toEqual({
      comingSoon: true,
      releaseDate: "15 Oct, 2026",
    });
  });

  it("detects Early Access release date change", () => {
    expect(
      getDiffData(GAME, STEAMGAMEDATA_WITH_EARLYRELEASEDATE_CHANGES),
    ).toEqual({
      isEarlyAccess: true,
      releaseDate: "15 Oct, 2026",
    });
  });
  it("detects additions change", () => {
    expect(getDiffData(GAME, STEAMGAMEDATA_WITH_ADDITIONS_CHANGES)).toEqual({
      dlc: ["5001840", "4024620", "4572870"],
    });
  });
  it("return empty object when there are no changes", () => {
    expect(getDiffData(GAME, EMPTY_STEAMGAMEDATA)).toEqual({});
  });

  it("return empty object when there are no changes with initial price meta", () => {
    expect(
      getDiffData(GAME_WITH_META_PRICE, EMPTY_STEAMGAMEDATA_WITH_PRICE),
    ).toEqual({});
  });
});

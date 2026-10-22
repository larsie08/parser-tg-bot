import { describe, expect, it } from "@jest/globals";

import { getDiffMeta } from "../../../modules";
import {
  BASE_STEAMGAMEDATA,
  EMPTY_STEAMGAMEDATA_WITH_PRICE,
  GAME,
  GAME_WITH_META_PRICE,
  STEAMGAMEDATA_WITH_ADDITIONS_CHANGES,
  STEAMGAMEDATA_WITH_EARLYRELEASEDATE_CHANGES,
  STEAMGAMEDATA_WITH_PRICE_RU_CHANGES,
  STEAMGAMEDATA_WITH_PRICE_USD_CHANGES,
  STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES,
} from "../../_data";
import { getUpcomingReleaseDateForTest } from "../../helpers/getUpcomingReleaseDate";

describe("getDiffMeta", () => {
  it("detects price change", () => {
    expect(getDiffMeta(GAME.meta, STEAMGAMEDATA_WITH_PRICE_RU_CHANGES)).toEqual(
      {
        price: 899,
        discount: "0",
        currency: "RUB",
      },
    );
    expect(
      getDiffMeta(GAME.meta, STEAMGAMEDATA_WITH_PRICE_USD_CHANGES),
    ).toEqual({
      price: 69.99,
      discount: "0",
      currency: "USD",
    });
  });
  it("detects release date change", () => {
    expect(
      getDiffMeta(GAME.meta, STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES),
    ).toEqual({
      comingSoon: true,
      releaseDate: getUpcomingReleaseDateForTest("date"),
    });
  });

  it("detects Early Access release date change", () => {
    expect(
      getDiffMeta(GAME.meta, STEAMGAMEDATA_WITH_EARLYRELEASEDATE_CHANGES),
    ).toEqual({
      isEarlyAccess: true,
      releaseDate: getUpcomingReleaseDateForTest("date"),
    });
  });
  it("detects additions change", () => {
    expect(
      getDiffMeta(
        GAME.meta,
        STEAMGAMEDATA_WITH_ADDITIONS_CHANGES,
        GAME.additions,
      ),
    ).toEqual({
      dlc: ["5001840", "4024620", "4572870"],
    });
  });
  it("return empty object when there are no changes", () => {
    expect(getDiffMeta(GAME.meta, BASE_STEAMGAMEDATA)).toEqual({});
  });

  it("return empty object when there are no changes with initial price meta", () => {
    expect(
      getDiffMeta(GAME_WITH_META_PRICE.meta, EMPTY_STEAMGAMEDATA_WITH_PRICE),
    ).toEqual({});
  });
});

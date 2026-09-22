import { describe, expect, it } from "@jest/globals";

import { getAdditionDiffData } from "../../modules";
import {
  ADDITION,
  BASE_ADDITIONDATA,
  STEAMGAMEDATA_WITH_EARLYRELEASEDATE_CHANGES,
  STEAMGAMEDATA_WITH_PRICE_RU_CHANGES,
  STEAMGAMEDATA_WITH_PRICE_USD_CHANGES,
  STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES,
} from "../_data";

describe("getAdditionDiffData", () => {
  it("detects price change", () => {
    expect(
      getAdditionDiffData(ADDITION, STEAMGAMEDATA_WITH_PRICE_RU_CHANGES),
    ).toEqual({
      price: 899,
      discount: "0",
      currency: "RUB",
    });
    expect(
      getAdditionDiffData(ADDITION, STEAMGAMEDATA_WITH_PRICE_USD_CHANGES),
    ).toEqual({
      price: 69.99,
      discount: "0",
      currency: "USD",
    });
  });
  it("detects releaseDate change", () => {
    expect(
      getAdditionDiffData(ADDITION, STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES),
    ).toEqual({
      comingSoon: true,
      releaseDate: "15 Oct, 2026",
    });
  });
  it("detects Early Access release date change", () => {
    expect(
      getAdditionDiffData(
        ADDITION,
        STEAMGAMEDATA_WITH_EARLYRELEASEDATE_CHANGES,
      ),
    ).toEqual({ isEarlyAccess: true, releaseDate: "15 Oct, 2026" });
  });
  it("return empty object when there are no changes", () => {
    expect(getAdditionDiffData(ADDITION, BASE_ADDITIONDATA)).toEqual({});
  });
});

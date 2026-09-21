import { describe, expect, it } from "@jest/globals";

import { getAdditionDiffData } from "../../modules";
import {
  ADDITION,
  ADDITIONDATA_WITH_EARLYRELEASEDATE_CHANGES,
  ADDITIONDATA_WITH_PRICE_RU_CHANGES,
  ADDITIONDATA_WITH_PRICE_USD_CHANGES,
  ADDITIONDATA_WITH_RELEASEDATE_CHANGES,
  EMPTY_ADDITIONDATA,
} from "../_data";

describe("getAdditionDiffData", () => {
  it("detects price change", () => {
    expect(
      getAdditionDiffData(ADDITION, ADDITIONDATA_WITH_PRICE_RU_CHANGES),
    ).toEqual({
      price: 1499,
      discount: "0",
      currency: "RUB",
    });
    expect(
      getAdditionDiffData(ADDITION, ADDITIONDATA_WITH_PRICE_USD_CHANGES),
    ).toEqual({
      price: 32,
      discount: "0",
      currency: "USD",
    });
  });
  it("detects releaseDate change", () => {
    expect(
      getAdditionDiffData(ADDITION, ADDITIONDATA_WITH_RELEASEDATE_CHANGES),
    ).toEqual({
      comingSoon: true,
      releaseDate: "15 Oct, 2026",
    });
  });
  it("detects Early Access release date change", () => {
    expect(
      getAdditionDiffData(ADDITION, ADDITIONDATA_WITH_EARLYRELEASEDATE_CHANGES),
    ).toEqual({ isEarlyAccess: true, releaseDate: "15 Oct, 2026" });
  });
  it("return empty object when there are no changes", () => {
    expect(getAdditionDiffData(ADDITION, EMPTY_ADDITIONDATA)).toEqual({});
  });
});

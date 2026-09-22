import { describe, expect, it } from "@jest/globals";
import { buildMetaUpdate } from "../../modules";
import {
  BASE_EXPECTED_META_UPDATE_RESULT,
  BASE_META,
  BASE_STEAMGAMEDATA,
  META_WITH_PRICE,
  META_WITH_RELEASEDATE,
  STEAMGAMEDATA_META_RELEASED,
  STEAMGAMEDATA_META_WITH_CURRENCY_CHANGES,
  STEAMGAMEDATA_META_WITH_MULTIPLE_CHANGES,
  STEAMGAMEDATA_META_WITH_RELEASEDATE_QUARTER_CHANGES,
  STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES,
} from "../_data";

describe("buildMetaUpdate", () => {
  it("updates releaseDate", () => {
    expect(
      buildMetaUpdate(STEAMGAMEDATA_WITH_RELEASEDATE_CHANGES, BASE_META),
    ).toEqual({
      ...BASE_EXPECTED_META_UPDATE_RESULT,
      releaseDate: "15 Oct, 2026",
      comingSoon: true,
    });
  });

  it("updates releaseDate with quarter", () => {
    expect(
      buildMetaUpdate(
        STEAMGAMEDATA_META_WITH_RELEASEDATE_QUARTER_CHANGES,
        BASE_META,
      ),
    ).toEqual({
      ...BASE_EXPECTED_META_UPDATE_RESULT,
      releaseDate: "Q4 2026",
      comingSoon: true,
    });
  });

  it("updates price metadata", () => {
    expect(
      buildMetaUpdate(
        STEAMGAMEDATA_META_WITH_MULTIPLE_CHANGES,
        META_WITH_PRICE,
      ),
    ).toMatchObject({
      price: 240,
      oldPrice: 360,
      currency: "RUB",
      discount: "10",
    });
  });

  it("sets releaseDate to null when the game is released", () => {
    expect(
      buildMetaUpdate(STEAMGAMEDATA_META_RELEASED, META_WITH_RELEASEDATE),
    ).toEqual({
      ...BASE_EXPECTED_META_UPDATE_RESULT,
      price: 240,
      currency: "RUB",
      releaseDate: null,
    });
  });

  it("returns unchanged fields when there are no changes", () => {
    expect(buildMetaUpdate(BASE_STEAMGAMEDATA, BASE_META)).toEqual(
      BASE_EXPECTED_META_UPDATE_RESULT,
    );
  });

  it("handles multiple meta changes", () => {
    expect(
      buildMetaUpdate(STEAMGAMEDATA_META_WITH_MULTIPLE_CHANGES, BASE_META),
    ).toEqual({
      ...BASE_EXPECTED_META_UPDATE_RESULT,
      price: 240,
      oldPrice: null,
      discount: "10",
      currency: "RUB",
      releaseDate: "15 Oct, 2026",
      comingSoon: true,
      isEarlyAccess: true,
    });
  });

  it("updates currency", () => {
    expect(
      buildMetaUpdate(
        STEAMGAMEDATA_META_WITH_CURRENCY_CHANGES,
        META_WITH_PRICE,
      ),
    ).toMatchObject({ currency: "USD", price: 12.0, oldPrice: 360 });
  });
});

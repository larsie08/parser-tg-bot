import axios from "axios";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { SteamService } from "../../integrations";

import {
  EXPECTED_STEAM_APP_DETAILS_EUR,
  EXPECTED_STEAM_APP_DETAILS_RU,
  EXPECTED_STEAM_APP_DETAILS_USD,
  GAME,
  STEAM_APP_DETAILS_RESPONSE_EUR,
  STEAM_APP_DETAILS_RESPONSE_RU,
  STEAM_APP_DETAILS_RESPONSE_USD,
} from "../_data";

jest.mock("axios");

const mockedAxios = jest.mocked(axios);

const steamService = new SteamService();

describe("fetchGameMetaInfoRegionalSteam", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses RUB Steam response", async () => {
    mockedAxios.get.mockResolvedValue({ data: STEAM_APP_DETAILS_RESPONSE_RU });

    const result = await steamService.fetchGameMetaInfoRegionalSteam(
      GAME.steamId,
    );

    expect(result).toEqual(EXPECTED_STEAM_APP_DETAILS_RU);
  });

  it("parses USD Steam response", async () => {
    mockedAxios.get.mockResolvedValue({ data: STEAM_APP_DETAILS_RESPONSE_USD });

    const result = await steamService.fetchGameMetaInfoRegionalSteam(
      GAME.steamId,
    );

    expect(result).toEqual(EXPECTED_STEAM_APP_DETAILS_USD);
  });

  it("parses EUR Steam response", async () => {
    mockedAxios.get.mockResolvedValue({ data: STEAM_APP_DETAILS_RESPONSE_EUR });

    const result = await steamService.fetchGameMetaInfoRegionalSteam(
      GAME.steamId,
    );

    expect(result).toEqual(EXPECTED_STEAM_APP_DETAILS_EUR);
  });
});

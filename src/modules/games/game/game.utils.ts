import { Markup } from "telegraf";
import { InlineKeyboardMarkup } from "telegraf/types";

import { buildPaginationButtons } from "../../../shared";

import { CommandActionName } from "../../../context";
import { Game, GameMeta, IGameSteamData } from "../..";

const GAMES_PER_PAGE = 5;

export function getDiffData(
  game: Game,
  steamGameData: IGameSteamData,
): Partial<IGameSteamData> {
  const changes: Partial<IGameSteamData> = {};

  if (!game.meta) {
    return changes;
  }

  const deniedKeys = [
    "name",
    "href",
    "oldPrice",
    "releaseTime",
    "lastSteamPageCheck",
  ];

  if (game.meta.isEarlyAccess) deniedKeys.push("releaseDate");

  const normalize = <T>(value: T | null | undefined): T | null => value ?? null;

  for (const key of Object.keys(steamGameData) as (keyof IGameSteamData)[]) {
    if (deniedKeys.includes(key)) continue;

    if (key === "dlc" && steamGameData.dlc) {
      const additionsGameId = new Set(
        game.additions.map((addition) => addition.steamId),
      );

      const newDlc = steamGameData.dlc.filter(
        (dlcId) => !additionsGameId.has(dlcId),
      );

      if (newDlc.length > 0) {
        changes.dlc = newDlc;
      }

      continue;
    }

    const newValue = normalize(steamGameData[key]);
    const oldValue = normalize(game.meta[key as keyof GameMeta]);

    if (oldValue !== newValue) {
      changes[key] = newValue as never;
    }
  }

  return changes;
}

export function hasMetaData(meta: GameMeta | null): boolean {
  if (!meta) return false;

  const keys: (keyof GameMeta)[] = [
    "price",
    "discount",
    "releaseDate",
    "releaseTime",
    "comingSoon",
    "isEarlyAccess",
  ];

  return keys.some((key) => {
    const value = meta[key];
    return value != null && value !== "";
  });
}

export function needsReleaseTracking(
  gameMeta: GameMeta,
  gameData?: IGameSteamData,
): boolean {
  if (
    gameData &&
    (gameMeta.comingSoon === undefined || gameMeta.isEarlyAccess === undefined)
  )
    if (!hasMetaData(gameMeta)) return false;

  return gameMeta.comingSoon! || gameMeta.isEarlyAccess!;
}

export function handleFormatUrlSearch(game: string): string {
  return encodeURIComponent(game);
}

export function parseGameNamesFromMessage(text: string): string[] {
  if (!text?.trim()) return [];

  return text
    .split(";")
    .map((game) => game.trim())
    .filter((game) => game.length > 0);
}

export function buildGamePaginationMarkUp(
  games: Game[],
  page: number,
  action: CommandActionName,
  deleteOption = false,
): Markup.Markup<InlineKeyboardMarkup> {
  const start = page * GAMES_PER_PAGE;
  const pageGames = games.slice(start, start + GAMES_PER_PAGE);

  const totalPages = Math.ceil(games.length / GAMES_PER_PAGE);

  const keyboard = pageGames.map((game) => [
    Markup.button.callback(
      `🎮 ${game.name}`,
      `${action}_select:${game.id}${deleteOption ? `:${page}` : ""}`,
    ),
  ]);

  const pagination = buildPaginationButtons(page, totalPages, action, false);

  return Markup.inlineKeyboard([...keyboard, ...pagination]);
}

export function buildMetaUpdate(gameData: IGameSteamData, meta: GameMeta) {
  const normalize = <T>(v: string | undefined | null): string | null =>
    v == null || v.trim() === "" ? null : v;

  return {
    price: normalize(gameData.price),
    oldPrice: normalize(
      meta.price && meta.price !== gameData.price ? meta.price : meta.oldPrice,
    ),
    discount: normalize(gameData.discount),
    comingSoon: gameData.comingSoon,
    releaseDate: gameData.releaseDate,
    isEarlyAccess: gameData.isEarlyAccess,
  };
}

import { IGameSteamData } from "../context";
import { Game, GameMeta } from "../entities";

export function handleFormatUrlSearch(game: string): string {
  return encodeURIComponent(game);
}

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
    game.meta.isEarlyAccess && "releaseDate",
  ];

  const normalize = <T>(value: T | null | undefined): T | null => value ?? null;

  for (const key of Object.keys(steamGameData) as (keyof IGameSteamData)[]) {
    if (deniedKeys.includes(key)) continue;

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

export function parseGameNamesFromMessage(text: string): string[] {
  if (!text?.trim()) return [];

  return text
    .split(";")
    .map((game) => game.trim())
    .filter((game) => game.length > 0);
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

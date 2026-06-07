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

  const deniedKeys = ["name", "href", "oldPrice", "comingSoon", "releaseTime"];

  for (const key of Object.keys(steamGameData) as (keyof IGameSteamData)[]) {
    if (deniedKeys.includes(key)) continue;

    const newValue = steamGameData[key];
    const oldValue = game.meta[key as keyof GameMeta];

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
  ];

  return keys.some((key) => {
    const value = meta[key];
    return value != null && value !== "";
  });
}

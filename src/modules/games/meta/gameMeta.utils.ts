import {
  Additions,
  DeniedMetaKeysForDiffFn,
  GameMeta,
  GameMetaType,
  IGameSteamData,
} from "../..";

const normalize = <T>(value: T | null | undefined): T | null => value ?? null;

export function buildMetaUpdate(gameData: IGameSteamData, meta: GameMeta) {
  const normalizeString = (v: string | undefined | null): string | null =>
    v == null || v.trim() === "" ? null : v;
  const normalizeNumber = (v: number | undefined | null): number | null =>
    v == null || isNaN(v) ? null : v;

  const releaseDate = isUpcomingReleaseDate(gameData.releaseDate)
    ? gameData.releaseDate
    : null;

  return {
    price: normalizeNumber(gameData.price),
    oldPrice: normalizeNumber(
      meta.price && meta.price !== gameData.price ? meta.price : meta.oldPrice,
    ),
    discount: normalizeString(gameData.discount),
    comingSoon: gameData.comingSoon,
    releaseDate: releaseDate,
    isEarlyAccess: gameData.isEarlyAccess,
    currency: normalizeString(gameData.currency),
  };
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
    return value && value !== "";
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

function isUpcomingReleaseDate(
  releaseDate: string | null | undefined,
): boolean {
  if (!releaseDate) {
    return false;
  }

  const value = releaseDate.trim();

  const yearMatch = value.match(/^\d{4}$/);

  if (yearMatch) {
    const year = Number(yearMatch[0]);
    return new Date(year + 1, 0, 1).getTime() > Date.now();
  }

  const quarterMatch = value.match(/^Q([1-4])\s+(\d{4})$/i);

  if (quarterMatch) {
    const quarter = Number(quarterMatch[1]);
    const year = Number(quarterMatch[2]);

    const nextQuarterStart = new Date(year, quarter * 3, 1);

    return nextQuarterStart.getTime() > Date.now();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date.getTime() >= today.getTime();
}

export function getMetaRelation(type: GameMetaType): "game" | "addition" {
  return type === GameMetaType.GAME ? "game" : "addition";
}

export function getDiffMeta(
  meta: GameMeta,
  steamGameData: IGameSteamData,
  additions?: Additions[],
): Partial<IGameSteamData> {
  const changes: Partial<IGameSteamData> = {};

  if (!meta) {
    return changes;
  }

  const deniedKeys: DeniedMetaKeysForDiffFn = [
    "name",
    "href",
    "oldPrice",
    "releaseTime",
  ];

  if (!additions) deniedKeys.push("dlc");
  if (meta.isEarlyAccess) deniedKeys.push("releaseDate");

  for (const key of Object.keys(steamGameData) as (keyof IGameSteamData)[]) {
    if (deniedKeys.includes(key)) continue;

    if (key === "dlc" && steamGameData.dlc && additions) {
      const additionsGameId = new Set(
        additions.map((addition) => addition.steamId),
      );

      const newDlc = (steamGameData.dlc ?? []).filter(
        (id) => !additionsGameId.has(id),
      );

      if (newDlc.length > 0) changes.dlc = newDlc;

      continue;
    }

    const newValue = normalize(steamGameData[key]);
    const oldValue = normalize(meta[key as keyof GameMeta]);

    if (oldValue !== newValue) {
      changes[key] = newValue as never;
    }
  }

  return changes;
}

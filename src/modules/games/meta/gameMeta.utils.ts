import { GameMeta, GameMetaType, IGameSteamData } from "../..";

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

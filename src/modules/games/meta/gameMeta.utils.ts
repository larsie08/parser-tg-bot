import { GameMeta, IGameSteamData } from "../..";

export function buildMetaUpdate(gameData: IGameSteamData, meta: GameMeta) {
  const normalizeString = (v: string | undefined | null): string | null =>
    v == null || v.trim() === "" ? null : v;
  const normalizeNumber = (v: number | undefined | null): number | null =>
    v == null || isNaN(v) ? null : v;

  const releaseDate = isUpcomingReleaseDate(gameData.releaseDate)
    ? gameData.releaseDate!
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

  const quarterMatch = releaseDate.match(/^Q([1-4])\s+(\d{4})$/);

  if (quarterMatch) {
    const quarter = Number(quarterMatch[1]);
    const year = Number(quarterMatch[2]);

    const quarterEndMonth = quarter * 3;
    const quarterEndDate = new Date(Date.UTC(year, quarterEndMonth, 0));

    return quarterEndDate.getTime() > Date.now();
  }

  const date = new Date(releaseDate);

  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

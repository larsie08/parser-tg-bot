import { GameMeta, IGameSteamData } from "../..";

export function buildMetaUpdate(gameData: IGameSteamData, meta: GameMeta) {
  const normalizeString = (v: string | undefined | null): string | null =>
    v == null || v.trim() === "" ? null : v;
  const normalizeNumber = (v: number | undefined | null): number | null =>
    v == null || isNaN(v) ? null : v;

  const releaseDate =
    gameData.releaseDate &&
    !Number.isNaN(new Date(gameData.releaseDate).getTime()) &&
    new Date(gameData.releaseDate).getTime() > Date.now()
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
    currency: gameData.currency,
  };
}

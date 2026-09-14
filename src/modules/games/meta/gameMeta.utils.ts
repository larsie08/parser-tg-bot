import { GameMeta, IGameSteamData } from "../..";

export function buildMetaUpdate(gameData: IGameSteamData, meta: GameMeta) {
  const normalize = <T>(v: string | undefined | null): string | null =>
    v == null || v.trim() === "" ? null : v;

  const releaseDate =
    gameData.releaseDate &&
    !Number.isNaN(new Date(gameData.releaseDate).getTime()) &&
    new Date(gameData.releaseDate).getTime() > Date.now()
      ? gameData.releaseDate
      : null;

  return {
    price: normalize(gameData.price),
    oldPrice: normalize(
      meta.price && meta.price !== gameData.price ? meta.price : meta.oldPrice,
    ),
    discount: normalize(gameData.discount),
    comingSoon: gameData.comingSoon,
    releaseDate: releaseDate,
    isEarlyAccess: gameData.isEarlyAccess,
  };
}

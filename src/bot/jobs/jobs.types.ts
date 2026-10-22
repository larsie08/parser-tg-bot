import {
  Additions,
  Game,
  GameMetaType,
  IGameSteamData,
  PriceHistory,
} from "../../modules";

type BaseParams = {
  game: Game;
  steamGameData: IGameSteamData;
  changesDetected: Partial<IGameSteamData>;
  lowestPriceInHistory: PriceHistory | null;
  releaseDate?: string;
};

export type MessageParams =
  | (BaseParams & { type: GameMetaType.GAME; isGameReleased: boolean })
  | (BaseParams & {
      type: GameMetaType.ADDITION;
      addition: Additions;
      isNewAddition: boolean;
      isAdditionReleased: boolean;
    });

import { GiveawayResolvedData } from "../../integrations";
import {
  Additions,
  Game,
  GameMetaType,
  IGameSteamData,
  PriceHistory,
  User,
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

export type TypeOfResponse = "comingSoon" | "isEarlyAccess" | "both";

export type IGameSteamDataWithHref<T = object> = IGameSteamData &
  GiveawayResolvedData &
  T;

export type GiveawayResponseData<T = object> = {
  games: IGameSteamDataWithHref<T>[];
  additions: (IGameSteamDataWithHref<T> & { game: Game })[];
};

export type GiveawayEntity =
  | GiveawayResponseData<{
      users: User[];
    }>["games"][number]
  | GiveawayResponseData<{
      game: Game;
      users: User[];
    }>["additions"][number];

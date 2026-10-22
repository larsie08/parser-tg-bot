import { Additions } from "../additions/additions.entity";
import { GameMeta } from "./gameMeta.entity";

export enum GameMetaType {
  GAME = "game",
  ADDITION = "addition",
}

export type DeniedMetaKeysForDiffFn = (
  | keyof GameMeta
  | "dlc"
  | "name"
  | "href"
)[];

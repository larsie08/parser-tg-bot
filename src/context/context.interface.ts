import { Context } from "telegraf";

import { User } from "../entities";

export interface PendingGame {
  steamGameName: string;
  steamId: string;
  href: string;
  user: User;
}

export interface SessionData {
  state: string | null;
  pendingGame: PendingGame[] | null;
}

export interface IBotContext extends Context {
  session: SessionData;
}

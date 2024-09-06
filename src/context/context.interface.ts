import { Context } from "telegraf";

export interface SessionData {
  games: string[];
  isCheckingPrice: boolean;
}

export interface IBotContext extends Context {
  session: SessionData;
}

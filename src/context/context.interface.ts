import { Context } from "telegraf";

export interface SessionData {
  games: string[];
}

export interface IBotContext extends Context {
  session: SessionData;
}
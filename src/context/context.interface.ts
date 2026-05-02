import { Context } from "telegraf";

import { User } from "../entities";

export type PendingGame = {
  steamGameName: string;
  steamId: string;
  href: string;
  user: User;
};

type MessagesId = {
  gameAddMessagesId: number[];
  gameDeleteMessagesId: number[];
  gameNewsMessagesId: number[];
  gameParserMessageId: number[];
};

export type MessagesIdKey = keyof MessagesId;

export interface SessionData {
  state: string | null;
  parserSelectedGame: string | null;
  pendingGame: PendingGame[] | null;
  messagesId: MessagesId;
  lastAskNextGameMessageId: number | null;
}

export interface IBotContext extends Context {
  session: SessionData;
}

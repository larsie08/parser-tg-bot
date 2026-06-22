import { Context } from "telegraf";

import { Game, User } from "../entities";
import { NewsSubscriptionsSettings } from "./news.interface";

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
  gameMenuCommandMessageId: number[];
  userSubscriptionsMessageId: number[];
  gameSubscriptionsMessageId: number[];
};

export type MessagesIdKey = keyof MessagesId;

export interface SessionData {
  state: string | null;
  parserSelectedGame: string | null;
  pendingGame: PendingGame[];
  messagesId: MessagesId;
  lastAskNextGameMessageId: number | null;
  subscriptionDraft: {
    global: NewsSubscriptionsSettings;
    game: NewsSubscriptionsSettings;
  };
  user: User | null;
  selectedGame: Game | null;
}

export interface IBotContext extends Context {
  session: SessionData;
  match?: RegExpExecArray;
}

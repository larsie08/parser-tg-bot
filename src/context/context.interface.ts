import { Context } from "telegraf";
import { Game, NewsSubscriptionsSettings, User } from "../modules";

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
  gameReleasesMessageId: number[];

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

export const COMMAND_ACTIONS = {
  gameAddCommand: "game_add",
  gameDeleteCommand: "game_delete",
  gameReleasesCommand: "game_releases",
  gameNewsCommand: "news_check",
  gameParserCommand: "price_check",
  globalSubscriptionCommand: "global_subscription",
  gameSubscriptionCommand: "game_subscription",
} as const;

export type CommandActionName =
  (typeof COMMAND_ACTIONS)[keyof typeof COMMAND_ACTIONS];

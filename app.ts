import "reflect-metadata";
import { session, Telegraf } from "telegraf";

import {
  ParserCommand,
  StartCommand,
  GameAddCommand,
  GameDeleteCommand,
  AutoParserCommand,
  GameNewsCommand,
  GlobalSubscriptionCommand,
} from "./src/commands";

import { Command, IBotContext, NewsType } from "./src/context";
import { AppDataSource } from "./src/config/typeOrm.config";

import {
  GameMetaService,
  GameService,
  NewsService,
  SteamService,
  UserNewsSubscriptionService,
  UserService,
} from "./src/services";

import { ConfigService, IConfigService } from "./src/config";

class Bot {
  bot: Telegraf<IBotContext>;
  commands: Command[] = [];

  constructor(private readonly ConfigService: IConfigService) {
    this.bot = new Telegraf<IBotContext>(this.ConfigService.get("TOKEN"));

    this.bot.use(
      session({
        defaultSession: () => ({
          state: null,
          parserSelectedGame: null,
          pendingGame: [],
          messagesId: {
            gameAddMessagesId: [],
            gameDeleteMessagesId: [],
            gameNewsMessagesId: [],
            gameParserMessageId: [],
            gameMenuCommandMessageId: [],
            userSubscriptionsMessageId: [],
          },
          lastAskNextGameMessageId: null,
          subscriptionDraft: {
            [NewsType.PATCHES]: true,
            [NewsType.DISCOUNTS]: true,
            [NewsType.ANNOUNCEMENTS]: true,
            [NewsType.DEV_DIARY]: true,
          },
        }),
      }),
    );
  }

  init() {
    const gameService = new GameService();
    const gameMetaService = new GameMetaService();
    const newsService = new NewsService();
    const userService = new UserService();
    const steamService = new SteamService();
    const userNewsSubscriptionService = new UserNewsSubscriptionService();

    this.commands = [
      new StartCommand(this.bot, userService),
      new ParserCommand(
        this.bot,
        gameMetaService,
        userService,
        gameService,
        steamService,
      ),
      new GameAddCommand(this.bot, userService, gameService, steamService),
      new GameDeleteCommand(this.bot, userService, gameService),
      new AutoParserCommand(
        this.bot,
        gameService,
        gameMetaService,
        newsService,
        steamService,
        userNewsSubscriptionService,
      ),
      new GameNewsCommand(
        this.bot,
        newsService,
        userService,
        gameService,
        steamService,
        userNewsSubscriptionService,
      ),
      new GlobalSubscriptionCommand(this.bot, userNewsSubscriptionService),
    ];

    for (const command of this.commands) {
      command.handle();
    }
    this.bot.launch();
  }
}

const bot = new Bot(new ConfigService());

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    bot.init();
  })
  .catch((error) =>
    console.error("Error during Data Source initialization:", error),
  );

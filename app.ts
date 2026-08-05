import "reflect-metadata";
import { session, Telegraf } from "telegraf";

import { AutoParserModule, NotificationModule } from "./src/modules";
import {
  ParserCommand,
  StartCommand,
  GameAddCommand,
  GameDeleteCommand,
  GameNewsCommand,
  GlobalSubscriptionCommand,
  GameSubscriptionCommand,
  GameReleasesCommand,
} from "./src/commands";

import {
  GameMetaService,
  GameNewsSubscriptionService,
  GameService,
  NewsService,
  SteamService,
  UserNewsSubscriptionService,
  UserService,
} from "./src/services";

import { Command, IBotContext, NewsType } from "./src/context";
import { AppDataSource } from "./src/config/typeOrm.config";
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
            gameMenuCommandMessageId: [],

            gameAddMessagesId: [],
            gameDeleteMessagesId: [],

            gameNewsMessagesId: [],
            gameParserMessageId: [],
            gameReleasesMessageId: [],

            userSubscriptionsMessageId: [],
            gameSubscriptionsMessageId: [],
          },
          lastAskNextGameMessageId: null,
          subscriptionDraft: {
            global: {
              [NewsType.PATCHES]: true,
              [NewsType.DISCOUNTS]: true,
              [NewsType.ANNOUNCEMENTS]: true,
              [NewsType.DEV_DIARY]: true,
            },
            game: {
              [NewsType.PATCHES]: true,
              [NewsType.DISCOUNTS]: true,
              [NewsType.ANNOUNCEMENTS]: true,
              [NewsType.DEV_DIARY]: true,
            },
          },
          user: null,
          selectedGame: null,
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
    const gameNewsSubscriptionService = new GameNewsSubscriptionService();

    this.commands = [
      new StartCommand(this.bot, userService),

      new AutoParserModule(
        this.bot,
        gameService,
        gameMetaService,
        newsService,
        steamService,
      ),
      new NotificationModule(this.bot, gameMetaService),

      new GameAddCommand(this.bot, userService, gameService, steamService),
      new GameDeleteCommand(this.bot, userService, gameService),

      new ParserCommand(this.bot, gameMetaService, gameService, steamService),
      new GameNewsCommand(this.bot, newsService, gameService, steamService),
      new GameReleasesCommand(this.bot, gameMetaService, steamService),

      new GlobalSubscriptionCommand(this.bot, userNewsSubscriptionService),
      new GameSubscriptionCommand(
        this.bot,
        gameService,
        gameNewsSubscriptionService,
      ),
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

import "reflect-metadata";
import { session, Telegraf } from "telegraf";

import {
  ParserCommand,
  StartCommand,
  GameAddCommand,
  GameDeleteCommand,
  AutoParserCommand,
  GameNewsCommand,
} from "./src/commands";

import { Command, IBotContext, IConfigService } from "./src/context";
import { AppDataSource } from "./src/config/typeOrm.config";

import {
  GameMetaService,
  GameService,
  NewsService,
  SteamService,
  UserService,
} from "./src/services";
import { ConfigService } from "./src/config";

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
          },
          lastAskNextGameMessageId: null,
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
      ),
      new GameNewsCommand(
        this.bot,
        newsService,
        userService,
        gameService,
        steamService,
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

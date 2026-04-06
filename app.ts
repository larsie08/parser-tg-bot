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

import { AppDataSource, ConfigService, IConfigService } from "./src/config";

import { Command, IBotContext } from "./src/context";

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
          pendingGame: null,
        }),
      }),
    );
  }

  init() {
    this.commands = [
      new StartCommand(this.bot),
      new ParserCommand(this.bot),
      new GameAddCommand(this.bot),
      new GameDeleteCommand(this.bot),
      new AutoParserCommand(this.bot),
      new GameNewsCommand(this.bot),
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

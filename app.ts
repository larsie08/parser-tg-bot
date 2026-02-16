import { Telegraf } from "telegraf";
import "reflect-metadata";

import {
  Command,
  ParserCommand,
  StartCommand,
  GameAddCommand,
  GameDeleteCommand,
  AutoParserCommand,
  GameNewsCommand,
} from "./src/commands";

import { IBotContext } from "./src/context/context.interface";
import { AppDataSource, ConfigService, IConfigService } from "./src/config";

class Bot {
  bot: Telegraf<IBotContext>;
  commands: Command[] = [];

  constructor(private readonly ConfigService: IConfigService) {
    this.bot = new Telegraf<IBotContext>(this.ConfigService.get("TOKEN"));
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

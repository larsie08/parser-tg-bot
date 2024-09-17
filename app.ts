import { Telegraf } from "telegraf";
import "reflect-metadata";

import { IConfigService } from "./src/config/config.interface";
import { ConfigService } from "./src/config/config.service";
import { IBotContext } from "./src/context/context.interface";

import {
  Command,
  ParserCommand,
  StartCommand,
  GameAddCommand,
} from "./src/commands";
import { AppDataSource } from "./src/config/typeOrm.config";

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
    ];
    for (const command of this.commands) {
      command.handle();
    }
    this.bot.launch();
  }
}

const bot = new Bot(new ConfigService());

bot.init();
AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((error) =>
    console.error("Error during Data Source initialization:", error)
  );
